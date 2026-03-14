import http from 'http'

// Attempt to fetch an image from the local dev server
const req = http.get('http://localhost:3000/api/og?slug=demo-slug', (res) => {
  let data = []
  
  res.on('data', chunk => data.push(chunk))
  
  res.on('end', () => {
    const buffer = Buffer.concat(data)
    console.log(`Response Status: ${res.statusCode}`)
    console.log(`Content-Type: ${res.headers['content-type']}`)
    
    // Check if it's text/html (an error page) or image/png
    if (res.headers['content-type']?.includes('text/html') || res.headers['content-type']?.includes('text/plain')) {
      console.log('Error content:', buffer.toString('utf8').substring(0, 500))
    } else {
      console.log(`Successfully pulled image of size: ${buffer.length} bytes`)
    }
  })
})

req.on('error', (e) => {
  console.error(`Local dev server might not be running: ${e.message}`)
})
