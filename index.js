const axios = require('axios');
const cheerio = require('cheerio');

//axios config options
const config = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
};

// Target URL (Google in this case)
const url = 'https://www.facebook.com';


// Fetch HTML content
axios.get(url)
  .then(response => {
    // Load HTML into Cheerio
    const $ = cheerio.load(response.data);
    
    // Extract the <title> tag text
    const pageTitle = $('title').text();
    
    console.log('Page Title:', pageTitle); // Output: "Google"
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
