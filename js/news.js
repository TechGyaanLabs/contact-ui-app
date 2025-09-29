apiKey = 'b968754c2b9a45d4bc54f5793806f40a';

const idShowNewsItems = document.querySelector('#idShowNewsItems');
const idCountry = document.querySelector('#idCountry');
const idCategory = document.querySelector('#idCategory');
const idFetchNewsBtn = document.querySelector('#idFetchNewsBtn');


async function fetchNews(country, category) {
    const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&apiKey=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

idCountry.addEventListener('change', getInputDataAndFetchNews);
idCategory.addEventListener('change', getInputDataAndFetchNews);
idFetchNewsBtn.addEventListener('click', getInputDataAndFetchNews);

function getInputDataAndFetchNews() {
    const country = idCountry.value;
    const category = idCategory.value;
    if (country.length === 0) {
        alert('Please enter a country code');
        return;
    }
    if (category.length === 0) {
        alert('Please enter a category');
        return;
    }
    result = fetchNews(country, category);
    showResult(result);
}

function showResult(result) {
    result.then(data => {
        if (data.status === 'ok' && data.totalResults > 0) {
            let articles = data.articles;
            let newsItems = [];
            articles.forEach(article => {
                newsItems.push({"title": article.title, "description": article.description, "image": article.urlToImage,"url": article.url});
            });

            idShowNewsItems.innerHTML = "";
            newsItems.forEach(item => {
                let itemText =`
                    <div class="card mt-3">
                        <img src=${item.image} class="card-img-top" alt="...">
                        <div class="card-body">
                            <h5 class="card-title">${item.title}</h5>
                            <p class="card-text">${item.description}</p>
                            <a href=${item.url} class="btn btn-primary">Go somewhere</a>
                        </div>
                    </div>
                `
                idShowNewsItems.innerHTML += itemText;
            });

        }else{
            idShowNewsItems.innerHTML = "<p class='text-muted text-center'>No news found, currently we don't have support for selected country or category...</p>";
        }
    }).catch(error => {
        console.log(error);
    }
    );
}
idFetchNewsBtn.click();
