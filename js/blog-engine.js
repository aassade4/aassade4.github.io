// Blog Engine - 博客内容管理系统核心
// 负责加载文章数据、解析Markdown并渲染到页面

class BlogEngine {
    constructor() {
        this.posts = [];
        this.markdownParser = new MarkdownParser();
        this.baseUrl = window.location.origin + '/';
    }
    
    // 加载文章数据
    async loadPosts() {
        try {
            const response = await fetch(this.baseUrl + 'data/posts.json');
            if (!response.ok) {
                throw new Error('Failed to load posts');
            }
            const data = await response.json();
            this.posts = data.posts;
            return this.posts;
        } catch (error) {
            console.error('Error loading posts:', error);
            return [];
        }
    }
    
    // 渲染首页文章列表
    async renderHomePage() {
        await this.loadPosts();
        
        const timelineAxis = document.getElementById('timeline-root');
        if (!timelineAxis) return;
        
        // 按日期倒序排序
        const sortedPosts = [...this.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 获取分类颜色映射
        const categoryColors = {
            'cpp': '#2b3a55',
            'java': '#552b2b',
            'misc': '#4a2b55',
            'web': '#2b3a55'
        };
        
        sortedPosts.forEach(post => {
            const category = post.category || 'misc';
            const color = categoryColors[category] || '#2b3a55';
            
            const articleHTML = `
                <div class="timeline-item">
                    <div class="timeline-marker" style="background-color: ${color};"></div>
                    <div class="timeline-content">
                        <div class="timeline-date">${post.date}</div>
                        <h4 class="timeline-title">${post.title}</h4>
                        <p class="timeline-preview">${this.getPostPreview(post.id)}</p>
                        <div class="timeline-meta">
                            <span class="timeline-category">${category.toUpperCase()}</span>
                            <span class="timeline-time">${post.readingTime} 分钟阅读</span>
                        </div>
                    </div>
                </div>
            `;
            
            timelineAxis.insertAdjacentHTML('beforeend', articleHTML);
        });
    }
    
    // 渲染归档页面
    async renderArchivePage() {
        await this.loadPosts();
        
        const archiveContainer = document.querySelector('.archive-container');
        if (!archiveContainer) return;
        
        // 按日期倒序排序
        const sortedPosts = [...this.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 按年份分组
        const postsByYear = {};
        sortedPosts.forEach(post => {
            const year = post.date.split('-')[0];
            if (!postsByYear[year]) {
                postsByYear[year] = [];
            }
            postsByYear[year].push(post);
        });
        
        // 生成HTML
        let archiveHTML = '<h3 class="section-header">/// 文章归档</h3>';
        
        Object.keys(postsByYear).sort().reverse().forEach(year => {
            archiveHTML += `<div class="archive-year"><h4>${year}</h4><ul class="archive-list">`;
            
            postsByYear[year].forEach(post => {
                const month = post.date.split('-')[1];
                archiveHTML += `<li><a href="../2025/12/${post.id}.html">${month}月 - ${post.title}</a></li>`;
            });
            
            archiveHTML += '</ul></div>';
        });
        
        archiveContainer.innerHTML = archiveHTML;
    }
    
    // 渲染分类页面
    async renderCategoryPage(category) {
        await this.loadPosts();
        
        const categoryPostsContainer = document.querySelector('.category-posts');
        if (!categoryPostsContainer) return;
        
        // 筛选指定分类的文章
        const categoryPosts = this.posts.filter(post => post.category === category);
        
        // 按日期倒序排序
        const sortedPosts = [...categoryPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 按年份分组
        const postsByYear = {};
        sortedPosts.forEach(post => {
            const year = post.date.split('-')[0];
            if (!postsByYear[year]) {
                postsByYear[year] = [];
            }
            postsByYear[year].push(post);
        });
        
        // 生成HTML，保持与原来相同的结构和样式
        let categoryHTML = '';
        
        Object.keys(postsByYear).sort().reverse().forEach(year => {
            categoryHTML += `<div class="archive-year">
                <h4>${year}</h4>
                <ul class="archive-list">`;
            
            postsByYear[year].forEach(post => {
                const month = post.date.split('-')[1];
                categoryHTML += `<li><a href="../../2025/12/${post.id}.html">${month}月 - ${post.title}</a></li>`;
            });
            
            categoryHTML += '</ul></div>';
        });
        
        // 只替换.category-posts容器的内容
        categoryPostsContainer.innerHTML = categoryHTML;
    }
    
    // 渲染文章详情页
    async renderPostPage(postId) {
        await this.loadPosts();
        
        const post = this.posts.find(p => p.id == postId);
        if (!post) {
            console.error('Post not found:', postId);
            return;
        }
        
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;
        
        // 解析Markdown内容
        const htmlContent = this.markdownParser.parse(post.content);
        
        // 生成文章HTML
        const postHTML = `
            <article class="post-container">
                <div class="post-header">
                    <h1>${post.title}</h1>
                    <div class="post-meta">
                        <span>${post.date}</span>
                        <span>${post.tags[0] || '未分类'}</span>
                        <span>阅读: ${post.views}</span>
                    </div>
                </div>
                
                <div class="post-content">
                    ${htmlContent}
                </div>
                
                <div class="post-footer">
                    <div class="post-tags">
                        ${post.tags.map(tag => `<a href="#" class="tag-link">${tag}</a>`).join('')}
                    </div>
                </div>
            </article>
        `;
        
        contentArea.innerHTML = postHTML;
        
        // 更新阅读量
        this.updatePostViews(postId);
    }
    
    // 更新文章阅读量
    updatePostViews(postId) {
        // 在实际应用中，这里会发送请求到服务器更新阅读量
        // 目前仅在客户端模拟
        const post = this.posts.find(p => p.id == postId);
        if (post) {
            post.views++;
        }
    }
    
    // 获取文章预览
    getPostPreview(postId, length = 100) {
        const post = this.posts.find(p => p.id == postId);
        if (!post) return '';
        
        // 移除Markdown标签并截取指定长度
        const text = post.content.replace(/#+\s+|\*\*|__|\*|_|`|```|>\s+/g, '');
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// 导出博客引擎
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogEngine;
} else {
    window.BlogEngine = BlogEngine;
}