// The reel's encoder and probe (scripts/social/reel.ts runs it with
// /usr/bin/swift on macOS; nothing is installed or downloaded).
//
//   swift encode-mp4.swift encode <frames-dir> <out.mp4> <fps> <bits-per-second>
//     Every PNG in <frames-dir>, in name order, as one H.264 frame of an MP4
//     (AVAssetWriter, optimised for network use, the moov atom up front).
//   swift encode-mp4.swift probe <file.mp4> [<out-dir> <seconds,seconds,...>]
//     Prints the video's duration, size, codec, frame rate, frame count and
//     bytes as one JSON line; with <out-dir>, also saves the frame at each
//     time as <out-dir>/at-<seconds>s.png.

import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data((message + "\n").utf8))
  exit(1)
}

func loadImage(_ url: URL) -> CGImage {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
  else { fail("Cannot read \(url.path)") }
  return image
}

func savePng(_ image: CGImage, to url: URL) {
  guard
    let destination = CGImageDestinationCreateWithURL(
      url as CFURL, UTType.png.identifier as CFString, 1, nil)
  else { fail("Cannot write \(url.path)") }
  CGImageDestinationAddImage(destination, image, nil)
  if !CGImageDestinationFinalize(destination) { fail("Cannot write \(url.path)") }
}

/** One frame drawn into a buffer from the adaptor's pool. */
func pixelBuffer(_ image: CGImage, pool: CVPixelBufferPool) -> CVPixelBuffer {
  var made: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &made)
  guard let buffer = made else { fail("No pixel buffer") }
  CVPixelBufferLockBaseAddress(buffer, [])
  defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
  guard
    let context = CGContext(
      data: CVPixelBufferGetBaseAddress(buffer),
      width: image.width,
      height: image.height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)
  else { fail("No bitmap context") }
  context.draw(image, in: CGRect(x: 0, y: 0, width: image.width, height: image.height))
  return buffer
}

func encode(framesDir: String, out: String, fps: Int32, bitrate: Int) {
  let dir = URL(fileURLWithPath: framesDir)
  let names = ((try? FileManager.default.contentsOfDirectory(atPath: framesDir)) ?? [])
    .filter { $0.hasSuffix(".png") }
    .sorted()
  guard let first = names.first else { fail("No PNG frames in \(framesDir)") }
  let size = loadImage(dir.appendingPathComponent(first))
  let (width, height) = (size.width, size.height)

  let outURL = URL(fileURLWithPath: out)
  try? FileManager.default.removeItem(at: outURL)
  guard let writer = try? AVAssetWriter(outputURL: outURL, fileType: .mp4) else {
    fail("Cannot write \(out)")
  }
  writer.shouldOptimizeForNetworkUse = true
  let input = AVAssetWriterInput(
    mediaType: .video,
    outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
      AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
      ],
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoExpectedSourceFrameRateKey: fps,
        AVVideoMaxKeyFrameIntervalKey: Int(fps),
      ],
    ])
  input.expectsMediaDataInRealTime = false
  let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ])
  writer.add(input)
  guard writer.startWriting() else { fail("Cannot start: \(String(describing: writer.error))") }
  writer.startSession(atSourceTime: .zero)

  for (index, name) in names.enumerated() {
    autoreleasepool {
      let image = loadImage(dir.appendingPathComponent(name))
      if image.width != width || image.height != height {
        fail("\(name) is \(image.width)x\(image.height), not \(width)x\(height)")
      }
      while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
      guard let pool = adaptor.pixelBufferPool else { fail("No pixel buffer pool") }
      let time = CMTime(value: CMTimeValue(index), timescale: fps)
      if !adaptor.append(pixelBuffer(image, pool: pool), withPresentationTime: time) {
        fail("Frame \(name) failed: \(String(describing: writer.error))")
      }
    }
  }
  input.markAsFinished()
  writer.endSession(atSourceTime: CMTime(value: CMTimeValue(names.count), timescale: fps))
  let done = DispatchSemaphore(value: 0)
  writer.finishWriting { done.signal() }
  done.wait()
  if writer.status != .completed {
    fail("Encoding failed: \(String(describing: writer.error))")
  }
  print("Encoded \(names.count) frames to \(out)")
}

func fourCC(_ code: FourCharCode) -> String {
  let bytes = [24, 16, 8, 0].map { UInt8((code >> $0) & 0xff) }
  return String(decoding: bytes, as: UTF8.self)
}

func countFrames(_ asset: AVAsset, _ track: AVAssetTrack) -> Int {
  guard let reader = try? AVAssetReader(asset: asset) else { fail("Cannot read the video") }
  let output = AVAssetReaderTrackOutput(track: track, outputSettings: nil)
  reader.add(output)
  reader.startReading()
  var frames = 0
  while let sample = output.copyNextSampleBuffer() {
    if CMSampleBufferGetNumSamples(sample) > 0 { frames += 1 }
  }
  return frames
}

func probe(path: String, outDir: String?, seconds: [Double]) async {
  let url = URL(fileURLWithPath: path)
  let asset = AVURLAsset(url: url)
  guard let track = try? await asset.loadTracks(withMediaType: .video).first,
    let duration = try? await asset.load(.duration),
    let (natural, rate, formats) = try? await track.load(
      .naturalSize, .nominalFrameRate, .formatDescriptions)
  else { fail("No video track in \(path)") }
  let codec = formats.first.map { fourCC(CMFormatDescriptionGetMediaSubType($0)) } ?? "none"
  let bytes = (try? FileManager.default.attributesOfItem(atPath: path)[.size] as? Int) ?? 0
  let info: [String: Any] = [
    "duration": duration.seconds,
    "width": Int(natural.width),
    "height": Int(natural.height),
    "codec": codec,
    "fps": Double(rate),
    "frames": countFrames(asset, track),
    "bytes": bytes,
    "fastStart": moovFirst(url),
  ]
  let json = try! JSONSerialization.data(withJSONObject: info, options: [.sortedKeys])
  print(String(decoding: json, as: UTF8.self))

  guard let outDir else { return }
  try? FileManager.default.createDirectory(
    atPath: outDir, withIntermediateDirectories: true)
  let generator = AVAssetImageGenerator(asset: asset)
  generator.requestedTimeToleranceBefore = .zero
  generator.requestedTimeToleranceAfter = .zero
  for second in seconds {
    let time = CMTime(seconds: second, preferredTimescale: 600)
    guard let (image, _) = try? await generator.image(at: time) else {
      fail("No frame at \(second) s")
    }
    let label = String(format: "%g", second)
    savePng(image, to: URL(fileURLWithPath: outDir).appendingPathComponent("at-\(label)s.png"))
  }
}

/** True when the `moov` box comes before `mdat` (fast start). */
func moovFirst(_ url: URL) -> Bool {
  guard let handle = try? FileHandle(forReadingFrom: url) else { return false }
  defer { try? handle.close() }
  var offset: UInt64 = 0
  while let header = try? handle.read(upToCount: 8), header.count == 8 {
    let size = header.prefix(4).reduce(UInt64(0)) { $0 << 8 | UInt64($1) }
    let kind = String(decoding: header.suffix(4), as: UTF8.self)
    if kind == "moov" { return true }
    if kind == "mdat" { return false }
    guard size >= 8 else { return false }
    offset += size
    try? handle.seek(toOffset: offset)
  }
  return false
}

let args = CommandLine.arguments
switch args.count > 1 ? args[1] : "" {
case "encode" where args.count == 6:
  guard let fps = Int32(args[4]), let bitrate = Int(args[5]) else { fail("Bad fps or bitrate") }
  encode(framesDir: args[2], out: args[3], fps: fps, bitrate: bitrate)
case "probe" where args.count == 3:
  await probe(path: args[2], outDir: nil, seconds: [])
case "probe" where args.count == 5:
  let seconds = args[4].split(separator: ",").compactMap { Double($0) }
  await probe(path: args[2], outDir: args[3], seconds: seconds)
default:
  fail(
    "Usage: encode <frames-dir> <out.mp4> <fps> <bits-per-second> | probe <file.mp4> [<out-dir> <seconds,...>]"
  )
}
