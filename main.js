

let a = {
	async init() {
		this.jq = jQuery;
		this.movies = this.jq('#movies');

		this.docElement = this.jq(document.documentElement);
        this.docElement.attr('data-theme','dark');
        this.themeSelector = this.jq('ul.theme-selector li');
        this.themeSelector.on('click',(e)=>{ this.initThemeSelect(e); });

		this.resultMovies = '';
		this.resultGenres = '';
		this.language = '?language=en-US';
		this.page = '';
		this.link = '';
		this.discoverURL = 'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false'+this.language+this.page+'&sort_by=popularity.desc';
		this.top_ratedURL = 'https://api.themoviedb.org/3/movie/top_rated'+this.language+this.page;
		this.genreURL = 'https://api.themoviedb.org/3/genre/movie/list'+this.language;

		this.getHeight = this.jq('.get-height');
		this.jq(window) .on('load resize',()=>{
			this.getHeight.length > 0?this.initGetHeight(this.getHeight):'';
		})        

		this.mainImage = this.jq('.main-image');
		this.mainImage.length>0?this.initScore():'';

		this.getYear();

		await this.apiRead(this.discoverURL,this.genreURL);

		this.searchForm = this.jq('form#search');
        this.searchForm.keypress((e) => { 
            if (e.which === 13) { 
                e.preventDefault();
                this.searchForm.submit();
            }
        });
        this.searchForm.submit((e)=>{
            e.preventDefault();
            this.searchData(e);

            this.displayApiData(this.link); 
        });

		this.trigger = this.jq('.trigger');
		this.trigger.on('click',(e)=>{ this.initTrigger(e); });

		
	},
	async apiRead(movies,genres) {
		const options = {
			method: 'GET',
			headers: {
				accept: 'application/json',
				Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4YzY5NWVjMjdmY2NjYjg3MzU2MDIyMGM1YTJlODg2NSIsInN1YiI6IjVhZTQ4ODM2YzNhMzY4NmY4YjAwYTllNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.GWPkIsylQphrKP5hLDCMq9gM3KUQQZC0c7LiG3y1NPQ'
			}
		};
		try {
			const [movie_response,genre_response] = await Promise.all([
				fetch(movies,options),
				fetch(genres,options)
			  ]);
			  this.resultMovies = await movie_response.json();
			  this.resultGenres = await genre_response.json();

			  this.showMovies(this.resultMovies.results);
		} catch (error) {
			console.error(error);
		}
	},
	async showMovies(movies) {
		var genres = this.resultGenres.genres;
		this.movies.empty();
		let html = '';
		movies.forEach(movie => {
			html = `
			<div class="single trigger modal-trigger" data-id="${movie.id}">
				<div class="box">
					<div class="image main-image" style="background-image:url('https://image.tmdb.org/t/p/w500${movie.poster_path}');" data-score="${Math.round(movie.vote_average*10)}"></div>                     
				</div>    
				
				<div class="footer">
					<p class="title">${movie.title}</p>
					<p class="release_date">${movie.release_date}</p>
				</div>
				<div class="trigger data-cover-trigger"><span class="info-icon">&#9432;</span></div>
				<div class="data-cover">
					<div class="content">
						<small>${movie.overview}</small>
					</div>
				</div>
			</div>
			
			<div class="modal d-none ${movie.id}">
				<div class="content">
					<div class="trigger close modal-close text-right">&times;</div>
					<small><span>Movie Id:</span>${movie.id}</small></br>
					<div class="row">
						<div class="col">
							<img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" />
						</div>
						<div class="col col-2">
							<h3>${movie.title}</h3>
							<p><span>Origina title:</span>${movie.original_title}</p>
							<p><span>Release date:</span>${movie.release_date}</p>
							<p><span>Popularity:</span>${movie.popularity} votes</p>
							<p><span>Avg. vote:</span>${Math.round(movie.vote_average*10)}%</p>`
			if(movie.adult == true) { 
			html +=		 	`<p class="danger">Adult Only</p>`;
			};  
							
			html += `
						</div>
						<div class="col col-3">
							<h4 class="">Overview:</h4>
							<div class="">
								<p>${movie.overview}</p>
							</div>
						
							<h4 class="">Genres:</h4>
							<div class="">
								<ul class="genres">`;				
							for(let i = 0; i < movie.genre_ids.length; i++) {
								for (let g = 0; g < genres.length; g++) {
									if(movie.genre_ids[i] == genres[g].id) {
										html += `<li class="trigger">${genres[g].name}</li>`;
									};					
								}				
							}
			html += 	
								`</ul>
							</div>						
						</div>
					</div>`;

			html += 
				`</div>
			</div>`;

			this.movies.append(html);
		});
	},
	pagination() {
		this.jq('#pagination').empty();
        let html = `
            <div class="content">
                <ul class="page-selector">`
                for(let i = 1;i < 11; i++) {
                    html += `<li class="trigger paginate" data-target="&page-${i}">${i}</li>`;
                }
            html += `
                </ul>
            </div>`;
        this.jq('#pagination').html(html);
    },
	async initTrigger(e) {
		let trigger = e.currentTarget;
		if(this.jq(trigger).hasClass('modal-trigger')) {
			let target = '.'+this.jq(trigger).attr('data-id');
			this.jq('.modal'+target).fadeIn();
		}
		if(this.jq(trigger).hasClass('accordion')) {
			let target = this.jq(trigger).next('.accordion-content');
			this.jq(target).slideToggle();
		}
		if(this.jq(trigger).hasClass('paginate')) {
			this.page = this.jq(trigger).attr('data-target');
			console.log(this.page);

			await this.displayMainData(this.link,this.page);
		}

		if(this.jq(trigger).hasClass('modal-close')) {
			this.jq('.modal').fadeOut();
		}
	},
    async initGetHeight(e) {
        var height = 0;
        e.each((i,e)=>{ height += this.jq(e).outerHeight(); });
        this.jq('main').css('height','calc(100vh - '+height+'px');
    },
    async getYear() {
        let date = new Date();
        let dateYear = date.getFullYear();
        this.jq('#date').html(dateYear);
    },
	async initThemeSelect(e) {
        console.log('theme select');
        var selector = e.currentTarget;
        if(this.jq(selector).hasClass('active')) {
            this.docElement.attr('data-theme','light');
            this.themeSelector.removeClass('active');
            this.jq(selector).addClass('active');
        }
        if(this.jq(selector).hasClass('dark')) {
            this.docElement.attr('data-theme','dark');
            this.themeSelector.removeClass('active');
            this.jq(selector).addClass('active');                
        };
    },
	async initScore() {
		var movieScore = this.mainImage.attr('data-score');
		movieScore.forEach(score => {
			console.log("SCORE: ",score);
		});
	},
}

a.init();
