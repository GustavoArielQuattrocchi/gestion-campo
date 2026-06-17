# Genera certificados HTTPS locales para Vite (iPhone necesita https:// para adjuntar PDF).
# Ejecutar una vez: powershell -ExecutionPolicy Bypass -File scripts/generate-dev-certs.ps1

$ErrorActionPreference = 'Stop'
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'dev-certs'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$dns = @('localhost', '127.0.0.1', '10.30.10.169')
$cert = New-SelfSignedCertificate `
  -Subject 'CN=GestionCampo Dev' `
  -DnsName $dns `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -NotAfter (Get-Date).AddYears(3) `
  -CertStoreLocation 'Cert:\CurrentUser\My' `
  -FriendlyName 'GestionCampo Vite HTTPS' `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable

$certPem = "-----BEGIN CERTIFICATE-----`n"
$certPem += [Convert]::ToBase64String($cert.RawData, 'InsertLineBreaks')
$certPem += "`n-----END CERTIFICATE-----"
Set-Content -Path (Join-Path $outDir 'cert.pem') -Value $certPem -Encoding ascii -NoNewline

$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
if (-not $rsa) { throw 'No se pudo leer la clave privada del certificado.' }

$xmlPath = Join-Path $outDir 'rsa-key.xml'
$rsa.ToXmlString($true) | Set-Content -Path $xmlPath -Encoding UTF8

$nodeScript = Join-Path $PSScriptRoot 'xml-rsa-to-pem.mjs'
node $nodeScript
if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar key.pem con Node.' }

Remove-Item $xmlPath -Force -ErrorAction SilentlyContinue

Write-Host "Certificados creados en: $outDir"
Write-Host "Reiniciá npm run dev y abrí https://10.30.10.169:5173/campo en el iPhone."
