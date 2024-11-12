/**
 * Represents a news item with its associated metadata
 */
interface NewsItem {
    hash: string;
    item: {
        title: string;
        description: string;
        links: string[];
        categories: string[];
        source: string;
        authors: { name: string }[];
        image: { url: string };
        published: string;
    };
}

/**
 * A class for fetching and managing news data from a JSON API
 */
export class NewsFetcher {
    private readonly baseUrl: string;
    private month: number;
    private year: number;
    private date: number;

    private readonly monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    /**
     * Creates a new NewsFetcher instance
     * @param baseUrl - The base URL of the news API
     * @param date - The day of the month (1-31)
     * @param month - The month number (1-12)
     * @param year - The year (e.g., 2024)
     */
    constructor(baseUrl: string, date: number, month: number, year: number) {
        this.baseUrl = baseUrl;
        this.month = month;
        this.year = year;
        this.date = date;
    }

    /**
     * Creates a URL string in the format: baseUrl/month-YYYY/DD-MM-YYYY.json
     * @returns The formatted URL string
     * @example "https://api.news.com/November-2024/12-11-2024.json"
     */
    private createUrl(): string {
        const monthString = this.monthNames[this.month - 1];
        const paddedDate = this.date.toString().padStart(2, '0');
        const paddedMonth = this.month.toString().padStart(2, '0');
        
        return `${this.baseUrl}/${monthString}-${this.year}/${paddedDate}-${paddedMonth}-${this.year}.json`;
    }

    /**
     * Updates the date parameters for the news fetcher
     * @param date - The day of the month (1-31)
     * @param month - The month number (1-12)
     * @param year - The year (2000-2100)
     * @throws Error if any parameter is out of valid range
     */
    public setDate(date: number, month: number, year: number): void {
        if (date < 1 || date > 31) throw new Error('Invalid date');
        if (month < 1 || month > 12) throw new Error('Invalid month');
        if (year < 2000 || year > 2100) throw new Error('Invalid year');

        this.date = date;
        this.month = month;
        this.year = year;
    }

    /**
     * Fetches news data from the API
     * @returns Promise containing an array of NewsItem objects
     * @throws Error if the HTTP request fails
     */
    private async fetchNewsData(): Promise<NewsItem[]> {
        try {
            const url = this.createUrl();
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching news data:', error);
            return [];
        }
    }

    /**
     * Returns a list of all unique news sources
     * @returns Promise containing an array of source names
     */
    public async ReturnAllSources(): Promise<string[]> {
        try {
            const data = await this.fetchNewsData();
            const sources = new Set(data.map(item => item.item.source));
            return Array.from(sources);
        } catch (error) {
            console.error('Error processing sources:', error);
            return [];
        }
    }

    /**
     * Returns all unique categories sorted by frequency (most to least common)
     * @returns Promise containing an array of category names
     */
    public async ReturnAllTopics(): Promise<string[]> {
        try {
            const data = await this.fetchNewsData();
            
            const categoryFrequency = new Map<string, number>();
            
            data.forEach(newsItem => {
                newsItem.item.categories.forEach(category => {
                    categoryFrequency.set(
                        category,
                        (categoryFrequency.get(category) || 0) + 1
                    );
                });
            });
            
            return Array.from(categoryFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
        } catch (error) {
            console.error('Error processing categories:', error);
            return [];
        }
    }
    
    /**
     * Returns all news items that contain a specific category
     * @param category - The category to search for
     * @returns Promise containing an array of matching NewsItems
     */
    public async ReturnNewsWithATopic(category: string): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            
            return data.filter(newsItem => 
                newsItem.item.categories.some(cat => 
                    cat.toLowerCase() === category.toLowerCase()
                )
            );
        } catch (error) {
            console.error('Error filtering news by category:', error);
            return [];
        }
    }

    /**
     * Returns all news items from a specific source
     * @param source - The news source to filter by
     * @returns Promise containing an array of matching NewsItems
     */
    public async ReturnNewsFromSource(source: string): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            
            return data.filter(newsItem => 
                newsItem.item.source.toLowerCase() === source.toLowerCase()
            );
        } catch (error) {
            console.error('Error filtering news by source:', error);
            return [];
        }
    }

    /**
     * Searches news items by keyword in title or description
     * @param keyword - The search term
     * @returns Promise containing an array of matching NewsItems
     */
    public async SearchNewsByKeyword(keyword: string): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            const searchTerm = keyword.toLowerCase();
            
            return data.filter(newsItem => 
                newsItem.item.title.toLowerCase().includes(searchTerm) ||
                newsItem.item.description.toLowerCase().includes(searchTerm)
            );
        } catch (error) {
            console.error('Error searching news:', error);
            return [];
        }
    }

    /**
     * Returns all news items by a specific author
     * @param authorName - The author's name to search for
     * @returns Promise containing an array of matching NewsItems
     */
    public async ReturnNewsByAuthor(authorName: string): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            const searchName = authorName.toLowerCase();
            
            return data.filter(newsItem => 
                newsItem.item.authors.some(author => 
                    author.name.toLowerCase().includes(searchName)
                )
            );
        } catch (error) {
            console.error('Error filtering by author:', error);
            return [];
        }
    }

    /**
     * Returns the most recent news items
     * @param limit - Maximum number of items to return (default: 10)
     * @returns Promise containing an array of the latest NewsItems
     */
    public async ReturnLatestNews(limit: number = 10): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            return data
                .sort((a, b) => 
                    new Date(b.item.published).getTime() - 
                    new Date(a.item.published).getTime()
                )
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching latest news:', error);
            return [];
        }
    }

    /**
     * Returns news items published within a specific date range
     * @param startDate - Start of the date range
     * @param endDate - End of the date range
     * @returns Promise containing an array of NewsItems within the date range
     */
    public async ReturnNewsInDateRange(startDate: Date, endDate: Date): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            return data.filter(newsItem => {
                const publishDate = new Date(newsItem.item.published);
                return publishDate >= startDate && publishDate <= endDate;
            });
        } catch (error) {
            console.error('Error filtering by date range:', error);
            return [];
        }
    }

    /**
     * Returns news items that contain all specified categories
     * @param categories - Array of categories to filter by
     * @returns Promise containing an array of NewsItems matching all categories
     */
    public async ReturnNewsWithMultipleCategories(categories: string[]): Promise<NewsItem[]> {
        try {
            const data = await this.fetchNewsData();
            const searchCategories = categories.map(cat => cat.toLowerCase());
            
            return data.filter(newsItem => 
                searchCategories.every(searchCat =>
                    newsItem.item.categories.some(cat => 
                        cat.toLowerCase() === searchCat
                    )
                )
            );
        } catch (error) {
            console.error('Error filtering by multiple categories:', error);
            return [];
        }
    }

    /**
     * Returns the most active news sources by article count
     * @param limit - Maximum number of sources to return (default: 5)
     * @returns Promise containing an array of source names and their article counts
     */
    public async ReturnTopSourcesByArticleCount(limit: number = 5): Promise<Array<{source: string, count: number}>> {
        try {
            const data = await this.fetchNewsData();
            const sourceCount = new Map<string, number>();
            
            data.forEach(newsItem => {
                const source = newsItem.item.source;
                sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
            });
            
            return Array.from(sourceCount.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([source, count]) => ({ source, count }));
        } catch (error) {
            console.error('Error calculating top sources:', error);
            return [];
        }
    }
}