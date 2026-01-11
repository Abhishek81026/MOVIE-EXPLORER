const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const movieGrid = document.getElementById('movieGrid');
const sortBy = document.getElementById('sortBy');
const messageArea = document.getElementById('messageArea');
const messageTitle = document.getElementById('messageTitle');
const messageSubtitle = document.getElementById('messageSubtitle');
const loader = document.getElementById('loader');
const resultCount = document.getElementById('resultCount');

const API_KEY = '6ce398ca';
let currentMovies = [];

// Set up our interactive elements
searchBtn.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
});
sortBy.addEventListener('change', handleSort);

async function searchMovies() {
    const query = searchInput.value.trim();

    if (!query) {
        alert('Please enter a movie title.');
        return;
    }

    showLoader();
    movieGrid.innerHTML = '';
    resultCount.textContent = '';
    
    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === 'True') {
            // We need a second call for each movie to get the juicy details like plot and exact rating
            const detailPromises = data.Search.map(movie => 
                fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${API_KEY}`).then(res => res.json())
            );
            
            currentMovies = await Promise.all(detailPromises);
            displayMovies(currentMovies);
            hideMessage();
        } else {
            showError('No Movies Found', `We couldn't find any results for "${query}". Try another title.`);
        }
    } catch (error) {
        showError('API Error', 'Something went wrong while fetching data. Please check your connection or API key.');
    } finally {
        hideLoader();
    }
}

function displayMovies(movies) {
    movieGrid.innerHTML = '';
    resultCount.textContent = `Showing ${movies.length} results`;

    if (movies.length === 0) {
        showError('No Results', 'Try adjusting your search or filters.');
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card relative bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105 group';
        
        const poster = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
        const rating = movie.imdbRating !== 'N/A' ? movie.imdbRating : 'N/A';
        
        card.innerHTML = `
            <img src="${poster}" alt="${movie.Title}" class="w-full h-[400px] object-cover" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            
            <!-- This little overlay shows title and rating at the bottom of the card -->
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <h3 class="font-bold text-lg truncate">${movie.Title}</h3>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-sm text-gray-400">${movie.Year}</span>
                    <span class="bg-red-600 text-xs font-bold px-2 py-1 rounded">
                        <i class="fas fa-star text-[10px] mr-1"></i>${rating}
                    </span>
                </div>
            </div>

            <!-- This one slides up when you hover, showing the plot and everything else -->
            <div class="movie-overlay absolute inset-0 flex flex-col justify-end p-6">
                <div class="mb-4">
                    <h3 class="text-xl font-bold mb-1">${movie.Title}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${movie.Genre.split(',').map(g => `<span class="text-[10px] bg-gray-700 px-2 py-0.5 rounded-full">${g.trim()}</span>`).join('')}
                    </div>
                    <p class="text-sm text-gray-300 line-clamp-4 mb-4">
                        ${movie.Plot}
                    </p>
                    <div class="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span><i class="fas fa-clock mr-1"></i>${movie.Runtime}</span>
                        <span><i class="fas fa-calendar mr-1"></i>${movie.Year}</span>
                    </div>
                </div>
                <button onclick="findSimilar('${movie.Genre.split(',')[0].trim()}')" class="w-full bg-red-600 text-white py-2 rounded font-semibold text-sm hover:bg-red-700 transition">
                    Find Similar
                </button>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

function findSimilar(genre) {
    searchInput.value = genre;
    searchMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSort() {
    const value = sortBy.value;
    if (currentMovies.length === 0) return;

    let sorted = [...currentMovies];

    switch (value) {
        case 'year-desc':
            sorted.sort((a, b) => parseInt(b.Year) - parseInt(a.Year));
            break;
        case 'year-asc':
            sorted.sort((a, b) => parseInt(a.Year) - parseInt(b.Year));
            break;
        case 'rating-desc':
            sorted.sort((a, b) => {
                const rA = a.imdbRating === 'N/A' ? 0 : parseFloat(a.imdbRating);
                const rB = b.imdbRating === 'N/A' ? 0 : parseFloat(b.imdbRating);
                return rB - rA;
            });
            break;
        default:
            // If default is selected, just leave them as they came from the API
            break;
    }

    displayMovies(sorted);
}

function showLoader() {
    loader.classList.remove('hidden');
    messageArea.classList.add('hidden');
    movieGrid.classList.add('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
    movieGrid.classList.remove('hidden');
}

function showError(title, subtitle) {
    messageArea.classList.remove('hidden');
    messageTitle.textContent = title;
    messageSubtitle.textContent = subtitle;
    movieGrid.innerHTML = '';
}

function hideMessage() {
    messageArea.classList.add('hidden');
}

// Auto-load suggestions on start
const suggestionKeywords = ['Avengers', 'Batman', 'Inception', 'Spider-Man', 'Star Wars'];
const randomKeyword = suggestionKeywords[Math.floor(Math.random() * suggestionKeywords.length)];
searchInput.value = randomKeyword;
searchMovies();
