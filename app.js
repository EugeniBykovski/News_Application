// Custom Http Module
function customHttp() {
    return {
        get(url, cb) {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.addEventListener('load', () => {
                    if (Math.floor(xhr.status / 100) !== 2) {
                        cb(`Error. Status code: ${xhr.status}`, xhr);
                        return;
                    }
                    const response = JSON.parse(xhr.responseText);
                    cb(null, response);
                });

                xhr.addEventListener('error', () => {
                    cb(`Error. Status code: ${xhr.status}`, xhr);
                });

                xhr.send();
            } catch (error) {
                cb(error);
            }
        },
        post(url, body, headers, cb) {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url);
                xhr.addEventListener('load', () => {
                    if (Math.floor(xhr.status / 100) !== 2) {
                        cb(`Error. Status code: ${xhr.status}`, xhr);
                        return;
                    }
                    const response = JSON.parse(xhr.responseText);
                    cb(null, response);
                });

                xhr.addEventListener('error', () => {
                    cb(`Error. Status code: ${xhr.status}`, xhr);
                });

                if (headers) {
                    Object.entries(headers).forEach(([key, value]) => {
                        xhr.setRequestHeader(key, value);
                    });
                }

                xhr.send(JSON.stringify(body));
            } catch (error) {
                cb(error);
            }
        },
    };
}

// Init http module
const http = customHttp();

// 1. Сначала нам нужно написать сервис для работы с нашими новостями. Есть некий новостной сервер. Напишем модуль с несколькими методами для запросов и он будет хранить API-ключ и API-url.

const newsService = (function() { // будем использовать сервис ладбше при выполнении запросов
    const apiKey = '39984fd984ad4684b5a4198e1ce22f1f';
    const apiUrl = 'https://newsapi.org/v2';

    return {
        // возвращаем объект с двумя методами, в которых будут происходить запросы к нашему серверу и каждый будет принимать страну и поисковая строка
        topHeadlines(country = 'ua', cb) {
            http.get(
                `${apiUrl}/top-headlines?country=${country}&category=technology&apiKey=${apiKey}`,
                cb,
            );
        },
        everything(query, cb) {
            http.get(`${apiUrl}/everything?q=${query}&apiKey=${apiKey}`, cb);
        },
    };
})();

// реализуем функционал для поиска form, select и т.д.
const form = document.forms['newsControls'];
const countrySelect = form.elements['country'];
const searchInput = form.elements['search'];

// повесим обработчик события на нашу форму
form.addEventListener('submit', e => {
    e.preventDefault();
    loadNews(); // должна еще и получить значение и country и search
});

document.addEventListener('DOMContentLoaded', function () {
    M.AutoInit(); // инициализирует все плагины materialize, input и т.д.
    loadNews(); // когда загрузится DOM, мы вызываем эту функцию, она вызывает запрос на сервер и мы ему передаем callback onFetResponse, он получает результат (articles) и передаем их в renderNews. Эта функция определяет контейнер и перебирает наши новости и формирует их в фрагмент, на основе полученных новостей
});

// Load news function - делаем базовую загрузку новостей, когда у нас будет грузиться страница
function loadNews() { // она будет делать запрос на указанные адреса
    // перед запуском будем показывать showLoader
    showLoader();

    // функция еще должна получить знаечния из countrySelect и searchInput
    const country = countrySelect.value;
    const searchText = searchInput.value;

    // делаем проверку
    if (!searchText) {
        newsService.topHeadlines(country, onGetResponse); // если в форме ничего нет, то user ищет только по стране
    } else {
        newsService.everything(searchText, onGetResponse); // иначе мы будем искать по введенному тексту
    }
}

// Function on get response from service
// Сигнатура - это то, что передается в нашу функцию (параметры)
function onGetResponse(err, res) { // отрабатывает, когда нам сервер возвращает ответ
    // срабатывание preloader
    removePreloader();

    // должны проверить, что у нас нет ошибок (+ Materialize, добавили отдельную функцию)
    if (err) {
        showAlert(err, 'error-msg');
        return;
    }

    // проверим отдельно новости 
    if (!res.articles.length) {
        // show empty message
        return;
    }

    renderNews(res.articles);
}

// функция, которая занимается рендерингом новостей
function renderNews(news) { // она будет получать новости и что-то с ними делать
    const newsContainer = document.querySelector('.news-container .row');

    if (newsContainer.children.length) { // если новости были, то они будут очищены
        clearContainer(newsContainer);
    }

    // создадим просто фрагмент и присвоив ему пустую строку
    let fragment = '';

    // теперь нам нужно перебирать массив новостей и собирать его во фрагмент и закидывать его в контейнер
    news.forEach(newsItem => {
        const el = newsTemplate(newsItem); // передает одну новость (разметка сохраняется в переменной el), на основе одной новости мы далее формируем разметку

        // на каждой итерации мы в фрагмент будем записывать результат вызова функции newsTemplate
        fragment += el; // разметка конкатенируется с переменной fragment
    });

    newsContainer.insertAdjacentHTML('afterbegin', fragment); // вставляем нашу разметку на страницу
}

// функция, которая будет очищать наш контейнер от перезаполнения
function clearContainer(container) {
   // пройдемся по всем дочерним элементам и удалим их по одному
   let child = container.lastElementChild;
   // первый способ: container.innerHTML = '';

   while (child) { // проверяем, если есть внутри контейнера новости
       container.removeChild(child); // удаляем элемент из контейнера
       child = container.lastElementChild; // перезаписываем переменную child (когда элементов не останется, то туда запишется null и цикл остановится)
   } 
}

// Разметка фрагмента - news item template function
function newsTemplate({ urlToImage, title, url, description }) {
    return `
        <div class="col s12">
            <div class="card">
                <div class="card-image">
                    <img src="${urlToImage}">
                    <span class="card-title">${title || ''}</span> 
                </div>
                <div class="card-content">
                    <p>${description || ''}</p>
                </div>
                <div class="card-action">
                    <a href="${url}">Read more</a>
                </div>
            </div>
        </div>
    `;
}

// функция, которая показывает уведомления 
function showAlert(msg, type = "success") {
    M.toast({ html: msg, classes: type });
}

// функция для preloader. Когда будет выводиться функция loadNews, будет запускаться preloader
function showLoader() {
    document.body.insertAdjacentHTML(
        'afterbegin', 
        `
            <div class="progress">
                <div class="indeterminate"></div>
            </div>
        `
    );
}

// функция скрывает прелоадер
function removePreloader() {
    const loader = document.querySelector('.progress');
    if (loader) {
        loader.remove();
    }
}