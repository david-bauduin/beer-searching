const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

app.get('/search', async (req, res) => {
  const query = req.query.q;
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
  });
  const page = await browser.newPage();
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto(`https://www.ratebeer.com/search?q=${query}&tab=beer`);
  
  await page.waitForSelector('.BeerTab___StyledDiv-gWeJQq');

  const beers = await page.evaluate(() => {
  const beerDivs = Array.from(document.querySelectorAll('.BeerTab___StyledDiv-gWeJQq')).slice(0, 8);

  const beers = [];
  beerDivs.forEach(beerDiv => {
    const beer = {};
	const link = beerDiv.querySelector('a').href;
	const id = link.match(/\/(\d+)\/$/)[1];
	const imageUrl = `https://res.cloudinary.com/ratebeer/image/upload/w_128,h_128,c_limit,d_Default_Beer_qqrv7k.png,f_auto/beer_${id}`;
    const brewery = beerDiv.querySelector('.MuiTypography-root');
    const name = beerDiv.querySelector('.MuiTypography-subtitle1');
    const percentage = beerDiv.querySelector('.MuiTypography-body2');
    const rating = beerDiv.querySelector('.MuiTypography-subtitle2');
    
    if(id) beer.id = id;
	if (imageUrl) beer.image = imageUrl;
    if (brewery) beer.brewery = brewery.innerText.trim().split('\n')[0];
    if (name) beer.name = name.innerText.trim();
    if (brewery) {
      const countryAndType = brewery.innerText.trim().split('\n')[2];
      const countryEmoji = countryAndType.slice(0, 4);
      switch (countryEmoji) {
		case '🇧🇪':
		  beer.country = 'Belgique';
		  break;
		case '🇩🇪':
		  beer.country = 'Allemagne';
		  break;
		case '🇨🇿':
		  beer.country = 'République tchèque';
		  break;
		case '🇳🇱':
		  beer.country = 'Pays-Bas';
		  break;
		case '🇬🇧':
		  beer.country = 'Royaume-Uni';
		  break;
		case '🇫🇷':
		  beer.country = 'France';
		  break;
		default:
		  beer.country = '';
	}
      beer.type = countryAndType.split('•')[0].slice(4).trim();
    }
    if (percentage) beer.percentage = percentage.innerText.split('•').pop().trim().split('\n')[0];
    if (rating) beer.rating = rating.innerText.trim().split('\n')[0];
	
    beers.push(beer);
  });

  return beers;
});

console.log(beers);

await browser.close();

  res.json(beers);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
