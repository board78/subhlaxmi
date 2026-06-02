Add-Type -AssemblyName System.Drawing
$imagePath = Join-Path (Get-Location) "public\logo.png"
if (Test-Path $imagePath) {
    $bmp = New-Object System.Drawing.Bitmap($imagePath)
    $pixel = $bmp.GetPixel(0,0)
    $w = $bmp.Width
    $h = $bmp.Height
    Write-Host "Width: $w, Height: $h"
    Write-Host "Top-Left Color: R=$($pixel.R), G=$($pixel.G), B=$($pixel.B), A=$($pixel.A)"
    $bmp.Dispose()
} else {
    Write-Host "Logo not found at $imagePath"
}
