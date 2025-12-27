// Markdown Parser for Blog System
// 一个简单但功能强大的Markdown解析器，支持常见的Markdown语法

class MarkdownParser {
    constructor() {
        this.rules = [
            // 标题（H1-H6）
            { regex: /^#{6}\s+(.+)$/gm, replacement: '<h6>$1</h6>' },
            { regex: /^#{5}\s+(.+)$/gm, replacement: '<h5>$1</h5>' },
            { regex: /^#{4}\s+(.+)$/gm, replacement: '<h4>$1</h4>' },
            { regex: /^#{3}\s+(.+)$/gm, replacement: '<h3>$1</h3>' },
            { regex: /^#{2}\s+(.+)$/gm, replacement: '<h2>$1</h2>' },
            { regex: /^#{1}\s+(.+)$/gm, replacement: '<h1>$1</h1>' },
            
            // 粗体和斜体
            { regex: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
            { regex: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
            { regex: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
            { regex: /_(.+?)_/g, replacement: '<em>$1</em>' },
            
            // 代码块
            { regex: /```([\s\S]*?)```/g, replacement: '<pre><code>$1</code></pre>' },
            { regex: /`(.+?)`/g, replacement: '<code>$1</code>' },
            
            // 引用
            { regex: /^>\s+(.+)$/gm, replacement: '<blockquote>$1</blockquote>' },
            
            // 列表
            { regex: /^-\s+(.+)$/gm, replacement: '<li>$1</li>' },
            { regex: /^\*\s+(.+)$/gm, replacement: '<li>$1</li>' },
            { regex: /^\d+\.\s+(.+)$/gm, replacement: '<li>$1</li>' },
            { regex: /(<li>.+<\/li>)+/gs, replacement: '<ul>$&</ul>' },
            
            // 链接和图片
            { regex: /\[(.+?)\]\((.+?)\)/g, replacement: '<a href="$2" target="_blank">$1</a>' },
            { regex: /!\[(.+?)\]\((.+?)\)/g, replacement: '<img src="$2" alt="$1" class="post-image">' },
            
            // 水平线
            { regex: /^---$/gm, replacement: '<hr>' },
            { regex: /^___$/gm, replacement: '<hr>' },
            { regex: /^\*\*\*$/gm, replacement: '<hr>' },
            
            // 段落
            { regex: /^(?!<h|<ul|<ol|<li|<blockquote|<pre|<code|<hr).+$/gm, replacement: '<p>$&</p>' },
            
            // 换行
            { regex: /\n\n/g, replacement: '</p><p>' },
            
            // 清理多余的标签
            { regex: /<\/p><\/p>/g, replacement: '</p>' },
            { regex: /<p><\/p>/g, replacement: '' }
        ];
    }
    
    parse(markdown) {
        let html = markdown;
        
        // 应用所有解析规则
        this.rules.forEach(rule => {
            html = html.replace(rule.regex, rule.replacement);
        });
        
        // 清理和优化HTML
        html = this.cleanup(html);
        
        return html;
    }
    
    cleanup(html) {
        // 修复列表嵌套
        html = html.replace(/<\/ul><ul>/g, '');
        html = html.replace(/<\/ol><ol>/g, '');
        
        // 确保标签正确关闭
        html = html.replace(/<p><h/g, '<h');
        html = html.replace(/<\/h(\d+)><\/p>/g, '</h$1>');
        
        return html;
    }
}

// 导出解析器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownParser;
} else {
    window.MarkdownParser = MarkdownParser;
}