$payload = @{
    messages = @(
        @{
            role = 'system'
            content = 'You are a helpful assistant.'
        },
        @{
            role = 'user'
            content = 'Tell me a short joke about programming.'
        }
    )
    model = 'google/gemini-2.5-pro-exp-03-25:free'
    response_format = @{
        type = 'json_schema'
        json_schema = @{
            name = 'ChatCompletionResponse'
            strict = $true
            schema = @{
                answer = 'string'
                reference = 'string'
            }
        }
    }
    temperature = 0.7
    max_tokens = 150
} | ConvertTo-Json -Depth 10

$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = "Bearer $env:OPENROUTER_API_KEY"
    'HTTP-Referer' = 'https://10xdevscards.com'
}

Write-Host "Sending request to OpenRouter API..."
Write-Host "Headers: $($headers | ConvertTo-Json)"
Write-Host "Payload: $payload"

$response = Invoke-RestMethod `
    -Uri 'https://openrouter.ai/api/v1/chat/completions' `
    -Method Post `
    -Headers $headers `
    -Body $payload

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10 