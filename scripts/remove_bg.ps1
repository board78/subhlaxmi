Add-Type -AssemblyName System.Drawing

$csharpSource = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageProcessor2 {
    public static void RemoveWhiteBackground(string inputPath, string outputPath) {
        using (Bitmap srcBmp = new Bitmap(inputPath)) {
            int width = srcBmp.Width;
            int height = srcBmp.Height;
            
            // Create a brand new 32bpp ARGB bitmap to hold the transparent output
            using (Bitmap destBmp = new Bitmap(width, height, PixelFormat.Format32bppArgb)) {
                // Draw src onto dest to guarantee it's a 32bpp ARGB format
                using (Graphics g = Graphics.FromImage(destBmp)) {
                    g.DrawImage(srcBmp, 0, 0, width, height);
                }
                
                BitmapData data = destBmp.LockBits(new Rectangle(0, 0, width, height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                int bytes = Math.Abs(data.Stride) * height;
                byte[] rgbValues = new byte[bytes];
                Marshal.Copy(data.Scan0, rgbValues, 0, bytes);
                
                for (int i = 0; i < rgbValues.Length; i += 4) {
                    byte b = rgbValues[i];
                    byte gVal = rgbValues[i + 1];
                    byte r = rgbValues[i + 2];
                    
                    // If the pixel is near-white (threshold 230 for R, G, B to catch subtle shades)
                    if (r > 230 && gVal > 230 && b > 230) {
                        rgbValues[i + 3] = 0; // Set Alpha to 0 (Transparent)
                    }
                }
                
                Marshal.Copy(rgbValues, 0, data.Scan0, bytes);
                destBmp.UnlockBits(data);
                
                // Overwrite the destination file
                destBmp.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

$inputPath = Join-Path (Get-Location) "public\logo.png"
$outputPath = Join-Path (Get-Location) "public\logo.png"
$backupPath = Join-Path (Get-Location) "public\logo_backup.png"

if (Test-Path $backupPath) {
    # Process from the original backup to logo.png
    Add-Type -TypeDefinition $csharpSource -ReferencedAssemblies "System.Drawing"
    [ImageProcessor2]::RemoveWhiteBackground($backupPath, $outputPath)
    Write-Host "Background removed from backup successfully and saved to $outputPath"
} else {
    Write-Host "Backup logo_backup.png not found at $backupPath"
}
