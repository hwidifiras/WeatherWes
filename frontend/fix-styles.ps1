$files = Get-ChildItem -Path "c:\Users\ASUS\Desktop\WeatherWeS\frontend\src\components\*.tsx" -File
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'className=\{styles\.\w+\}', 'className=""'
    $content = $content -replace 'className=\{\\$\{styles\.\w+\}[^}]*\}', 'className=""'
    $content = $content -replace 'styles\.\w+', '""'
    Set-Content $file.FullName -Value $content
}
