$root = "C:\Users\STEVEN\Desktop\EventApp"
$assetsDir = Join-Path $root "assets"
$backendDir = Join-Path $root "backend"

function Get-DataUri($filePath) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $mime = @{
        '.png' = 'image/png'
        '.jpg' = 'image/jpeg'
        '.jpeg' = 'image/jpeg'
    }
    $mimeType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'image/png' }
    return "data:$mimeType;base64,$base64"
}

# --- EVENT IMAGES ---
# Map event IDs to the actual image files in assets/events/
$eventImageMap = @{
    "event_1"              = "7903ba759388609c8cc053af8ae8dc4c60a50dd0.png"   # Mr & Miss Cavendish
    "event_2"              = "d7ae4b74561b5c62377c6e8e1ada58ad3e80fef4.png"   # Fresher's Bash
    "event_3"              = "d7ae4b74561b5c62377c6e8e1ada58ad3e80fef4.png"   # International Students
    "event_4"              = "9740598005f689306f597b4d692dc46014798202.png"   # Cultural Day
    "event_5"              = "dfe3dd58b825e2385a751187d0e16cf5736a02da.png"   # Career Expo
    "event_6"              = "6356727368ab75ac3f4eea867fb27bcc7ccd9258.png"   # ZUSA Games
    "event_7"              = "dfe3dd58b825e2385a751187d0e16cf5736a02da.png"   # Entrepreneurship Summit
    "event_8"              = "ed7bfb12660b2fe3e71ec2eb1a6f020bb7f683fa.png"   # Medical Faculty
    "event_colour_run"     = "9740598005f689306f597b4d692dc46014798202.png"   # Colour Run (reuse Cultural Day)
    "event_dev3pack_hackathon" = "dev3pack_logo.jpg"                          # Dev3Pack Hackathon
}

$eventDataUris = @{}
foreach ($key in $eventImageMap.Keys) {
    $file = $eventImageMap[$key]
    $filePath = Join-Path (Join-Path $assetsDir "events") $file
    if (Test-Path $filePath) {
        $eventDataUris[$key] = Get-DataUri $filePath
        Write-Host "Converted event $key -> $file"
    } else {
        Write-Warning "File not found: $filePath"
    }
}

# Update events.json - replace image field with data URI for matching events
$eventsPath = Join-Path (Join-Path $backendDir "data") "events.json"
$events = Get-Content $eventsPath -Raw | ConvertFrom-Json
$updatedEvents = @()
$matched = 0
foreach ($event in $events) {
    if ($eventDataUris.ContainsKey($event.image)) {
        $event.image = $eventDataUris[$event.image]
        $matched++
    } elseif ($eventDataUris.ContainsKey($event.id)) {
        $event.image = $eventDataUris[$event.id]
        $matched++
    }
    $updatedEvents += $event
}
$updatedEvents | ConvertTo-Json -Depth 10 | Set-Content $eventsPath
Write-Host "Updated events.json - matched $matched out of $($events.Count) events"

# --- CLUB IMAGES ---
# Map club IDs to actual images in assets/club-images/
$clubImageMap = @{
    "club_1"  = "cavendish logo.jpg"       # Athletics Association
    "club_2"  = "cavendish logo.jpg"       # Career Services
    "club_3"  = "cavendish logo.jpg"       # Cultural Society
    "club_4"  = "debate club.png"          # Debate Club
    "club_5"  = "cavendish logo.jpg"       # Entrepreneurship Club
    "club_6"  = "student association.jpg"  # Student Union
    "club_7"  = "cavendish logo.jpg"       # Medical Society
    "club_8"  = "photography.jpg"          # Photography Club
    "club_9"  = "chess.jpg"                # Chess Club
    "club_10" = "CUZITA Club.jpeg"         # CUZITA Club
}

$clubsPath = Join-Path (Join-Path $backendDir "data") "clubs.json"
$clubs = Get-Content $clubsPath -Raw | ConvertFrom-Json
$updatedClubs = @()

foreach ($club in $clubs) {
    if ($clubImageMap.ContainsKey($club.id)) {
        $file = $clubImageMap[$club.id]
        $filePath = Join-Path (Join-Path $assetsDir "club-images") $file
        if (Test-Path $filePath) {
            $club.image = Get-DataUri $filePath
            Write-Host "Converted club $($club.id) -> $file"
        }
    }
    $updatedClubs += $club
}
$updatedClubs | ConvertTo-Json -Depth 10 | Set-Content $clubsPath
Write-Host "Updated clubs.json with actual images"

Write-Host "`nDone! All images converted and seed data updated for EventApp."
