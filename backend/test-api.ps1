$API_URL = "http://localhost:3001"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Testing Headless Builder API" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

# Step 1: Register or Login
Write-Host "1. Creating/logging test account..." -ForegroundColor Green
try {
    $registerBody = @{
        email = "test@agency.com"
        password = "password123"
        firstName = "Test"
        lastName = "User"
        agencyName = "Test Agency"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    $TOKEN = $response.token
    Write-Host "Account created!" -ForegroundColor Green
} catch {
    Write-Host "Account exists, trying login..." -ForegroundColor Yellow
    $loginBody = @{
        email = "test@agency.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $response.token
    Write-Host "Logged in!" -ForegroundColor Green
}

Write-Host "Token: $($TOKEN.Substring(0,20))...`n" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# Step 2: Create Hero Component
Write-Host "2. Creating Hero component..." -ForegroundColor Green
$heroBody = @{
    name = "Hero Section"
    category = "Hero"
    description = "Section hero avec titre, sous-titre et CTA"
    schema = @{
        fields = @(
            @{
                name = "title"
                type = "text"
                label = "Titre principal"
                required = $true
                defaultValue = "Bienvenue"
            },
            @{
                name = "subtitle"
                type = "textarea"
                label = "Sous-titre"
            },
            @{
                name = "backgroundImage"
                type = "image"
                label = "Image de fond"
            },
            @{
                name = "ctaText"
                type = "text"
                label = "Texte du bouton"
                defaultValue = "En savoir plus"
            },
            @{
                name = "ctaUrl"
                type = "url"
                label = "Lien du bouton"
            }
        )
    }
} | ConvertTo-Json -Depth 10

$hero = Invoke-RestMethod -Uri "$API_URL/api/components" -Method Post -Body $heroBody -Headers $headers
Write-Host "Hero created with ID: $($hero.id)" -ForegroundColor Green
$hero | ConvertTo-Json -Depth 5
Write-Host ""

# Step 3: Create Card Component
Write-Host "3. Creating Card component..." -ForegroundColor Green
$cardBody = @{
    name = "Card"
    category = "Card"
    description = "Carte avec image et texte"
    schema = @{
        fields = @(
            @{
                name = "image"
                type = "image"
                label = "Image"
                required = $true
            },
            @{
                name = "title"
                type = "text"
                label = "Titre"
                required = $true
            },
            @{
                name = "description"
                type = "textarea"
                label = "Description"
            }
        )
    }
} | ConvertTo-Json -Depth 10

$card = Invoke-RestMethod -Uri "$API_URL/api/components" -Method Post -Body $cardBody -Headers $headers
Write-Host "Card created with ID: $($card.id)" -ForegroundColor Green
$card | ConvertTo-Json -Depth 5
Write-Host ""

# Step 4: Create CTA Component
Write-Host "4. Creating CTA Banner component..." -ForegroundColor Green
$ctaBody = @{
    name = "CTA Banner"
    category = "CTA"
    description = "Bannière call-to-action"
    schema = @{
        fields = @(
            @{
                name = "title"
                type = "text"
                label = "Titre"
                required = $true
            },
            @{
                name = "buttonText"
                type = "text"
                label = "Texte du bouton"
                required = $true
            },
            @{
                name = "buttonUrl"
                type = "url"
                label = "URL du bouton"
                required = $true
            }
        )
    }
} | ConvertTo-Json -Depth 10

$cta = Invoke-RestMethod -Uri "$API_URL/api/components" -Method Post -Body $ctaBody -Headers $headers
Write-Host "CTA created with ID: $($cta.id)" -ForegroundColor Green
Write-Host ""

# Step 5: List all components
Write-Host "5. Listing all components..." -ForegroundColor Green
$components = Invoke-RestMethod -Uri "$API_URL/api/components" -Headers $headers
$components | ConvertTo-Json -Depth 3
Write-Host ""

# Step 6: Get Hero details
Write-Host "6. Getting Hero component details..." -ForegroundColor Green
$heroDetails = Invoke-RestMethod -Uri "$API_URL/api/components/$($hero.id)" -Headers $headers
$heroDetails | ConvertTo-Json -Depth 5
Write-Host ""

# Step 7: Update Hero
Write-Host "7. Updating Hero component..." -ForegroundColor Green
$updateBody = @{
    description = "Section hero mise à jour avec nouveau design"
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "$API_URL/api/components/$($hero.id)" -Method Put -Body $updateBody -Headers $headers
Write-Host "Updated! New description: $($updated.description)" -ForegroundColor Green
Write-Host ""

# Step 8: Filter by category
Write-Host "8. Filtering by category (Hero)..." -ForegroundColor Green
$filtered = Invoke-RestMethod -Uri "$API_URL/api/components?category=Hero" -Headers $headers
Write-Host "Found $($filtered.Count) Hero component(s)" -ForegroundColor Green
Write-Host ""

# Step 9: Search
Write-Host "9. Searching for 'card'..." -ForegroundColor Green
$search = Invoke-RestMethod -Uri "$API_URL/api/components?search=card" -Headers $headers
Write-Host "Found $($search.Count) component(s) matching 'card'" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Blue
Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host "`nCreated components:" -ForegroundColor Yellow
Write-Host "  - Hero:   $($hero.id)" -ForegroundColor Cyan
Write-Host "  - Card:   $($card.id)" -ForegroundColor Cyan
Write-Host "  - CTA:    $($cta.id)" -ForegroundColor Cyan
