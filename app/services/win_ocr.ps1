param(
    [Parameter(Mandatory=$true)]
    [string]$ImagePath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ImagePath)) {
    Write-Error "File not found: $ImagePath"
    exit 1
}

$fullPath = (Get-Item $ImagePath).FullName

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function AwaitOperation($asyncOp, $type) {
    $asTask = $asTaskGeneric.MakeGenericMethod($type)
    $netTask = $asTask.Invoke($null, @($asyncOp))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
$fileOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($fullPath)
$storageFile = AwaitOperation $fileOp ([Windows.Storage.StorageFile])

$streamOp = $storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)
$stream = AwaitOperation $streamOp ([Windows.Storage.Streams.IRandomAccessStream])

[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime] | Out-Null
$decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
$decoder = AwaitOperation $decoderOp ([Windows.Graphics.Imaging.BitmapDecoder])

$bitmapOp = $decoder.GetSoftwareBitmapAsync()
$softwareBitmap = AwaitOperation $bitmapOp ([Windows.Graphics.Imaging.SoftwareBitmap])

[Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null

$ocrEngine = $null
try {
    $lang = [Windows.Globalization.Language]::new("en-US")
    $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
} catch {}

if (-not $ocrEngine) {
    $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}

$ocrOp = $ocrEngine.RecognizeAsync($softwareBitmap)
$ocrResult = AwaitOperation $ocrOp ([Windows.Media.Ocr.OcrResult])

$lines = @()
foreach ($line in $ocrResult.Lines) {
    $lines += $line.Text
}

$output = [PSCustomObject]@{
    Text = ($lines -join "`n")
    LinesCount = $lines.Count
    Angle = $ocrResult.TextAngle
}

$output | ConvertTo-Json -Compress
