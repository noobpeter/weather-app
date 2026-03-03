/**
 * ATMOS — 大气观测站
 * 使用 Open-Meteo API (支持 CORS，稳定可靠)
 * 设计风格: 赛博朋克 + 玻璃拟态
 */

const DEBUG = true;

// 常见城市中英文映射表
const CITY_MAPPING = {
    // 中国主要城市
    '北京': 'Beijing',
    '上海': 'Shanghai',
    '广州': 'Guangzhou',
    '深圳': 'Shenzhen',
    '杭州': 'Hangzhou',
    '南京': 'Nanjing',
    '成都': 'Chengdu',
    '武汉': 'Wuhan',
    '西安': 'Xian',
    '重庆': 'Chongqing',
    '天津': 'Tianjin',
    '苏州': 'Suzhou',
    '郑州': 'Zhengzhou',
    '长沙': 'Changsha',
    '沈阳': 'Shenyang',
    '青岛': 'Qingdao',
    '宁波': 'Ningbo',
    '东莞': 'Dongguan',
    '无锡': 'Wuxi',
    '厦门': 'Xiamen',
    '福州': 'Fuzhou',
    '昆明': 'Kunming',
    '合肥': 'Hefei',
    '哈尔滨': 'Harbin',
    '济南': 'Jinan',
    '长春': 'Changchun',
    '南宁': 'Nanning',
    '贵阳': 'Guiyang',
    '兰州': 'Lanzhou',
    '海口': 'Haikou',
    '乌鲁木齐': 'Urumqi',
    '银川': 'Yinchuan',
    '西宁': 'Xining',
    '拉萨': 'Lhasa',
    '台北': 'Taipei',
    '香港': 'Hong Kong',
    '澳门': 'Macau',
    // 国际主要城市
    '东京': 'Tokyo',
    '纽约': 'New York',
    '伦敦': 'London',
    '巴黎': 'Paris',
    '悉尼': 'Sydney',
    '新加坡': 'Singapore',
    '首尔': 'Seoul',
    '曼谷': 'Bangkok',
    '迪拜': 'Dubai',
    '洛杉矶': 'Los Angeles',
    '旧金山': 'San Francisco',
    '芝加哥': 'Chicago',
    '多伦多': 'Toronto',
    '温哥华': 'Vancouver',
    '柏林': 'Berlin',
    '莫斯科': 'Moscow',
    '罗马': 'Rome',
    '马德里': 'Madrid',
    '阿姆斯特丹': 'Amsterdam',
    '斯德哥尔摩': 'Stockholm'
};

// 热门城市列表
const HOT_CITIES = [
    { name: '北京', en: 'Beijing' },
    { name: '上海', en: 'Shanghai' },
    { name: '广州', en: 'Guangzhou' },
    { name: '深圳', en: 'Shenzhen' },
    { name: '杭州', en: 'Hangzhou' },
    { name: '东京', en: 'Tokyo' },
    { name: '纽约', en: 'New York' },
    { name: '伦敦', en: 'London' }
];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="initial-state">
            <div class="icon">🌌</div>
            <p>输入城市名称开始探索大气数据</p>
            <div class="hot-cities">
                <p class="hot-title">热门城市</p>
                <div class="city-tags">
                    ${HOT_CITIES.map(city => `
                        <button class="city-tag" onclick="selectCity('${city.en}')">
                            ${city.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // 添加输入监听
    const input = document.getElementById('cityInput');
    input.addEventListener('input', handleInput);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });
});

function log(...args) {
    if (DEBUG) console.log('[ATMOS]', ...args);
}

// 检测是否包含中文字符
function hasChinese(str) {
    return /[\u4e00-\u9fa5]/.test(str);
}

// 处理输入
function handleInput(e) {
    const input = e.target;
    const value = input.value.trim();
    const hint = document.getElementById('inputHint') || createHintElement();
    
    if (hasChinese(value)) {
        const mapped = CITY_MAPPING[value];
        if (mapped) {
            hint.innerHTML = `将搜索: <strong>${mapped}</strong> (已自动转换)`;
            hint.className = 'input-hint success';
        } else {
            hint.innerHTML = `中文城市名可能无法识别，建议尝试拼音或英文，如 "shanghai" 或 "Beijing"`;
            hint.className = 'input-hint warning';
        }
    } else {
        hint.textContent = '';
    }
}

// 创建提示元素
function createHintElement() {
    const input = document.getElementById('cityInput');
    const hint = document.createElement('div');
    hint.id = 'inputHint';
    hint.className = 'input-hint';
    input.parentNode.appendChild(hint);
    return hint;
}

// 选择城市
function selectCity(cityName) {
    document.getElementById('cityInput').value = cityName;
    searchWeather();
}

async function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    let city = cityInput.value.trim();
    const resultDiv = document.getElementById('result');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!city) {
        showError('请输入城市名称');
        return;
    }
    
    // 中文转英文
    let displayCity = city;
    if (hasChinese(city)) {
        const mapped = CITY_MAPPING[city];
        if (mapped) {
            log('中文城市名转换:', city, '->', mapped);
            displayCity = mapped;
        } else {
            showInputGuidance(city);
            return;
        }
    }
    
    // 显示加载状态
    searchBtn.disabled = true;
    searchBtn.textContent = '加载中...';
    resultDiv.innerHTML = `
        <div class="loading-container fade-in">
            <div class="loading-spinner"></div>
            <p class="loading-text">正在连接大气观测网络...</p>
        </div>
    `;
    
    log('开始查询城市:', displayCity);
    
    try {
        const data = await fetchFromOpenMeteo(displayCity);
        log('获取数据成功:', data);
        displayWeather(data, city); // 传入原始输入用于显示
        
    } catch (error) {
        log('查询失败:', error);
        handleError(error, city);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '观测';
    }
}

// 使用 Open-Meteo API
async function fetchFromOpenMeteo(city) {
    log('使用 Open-Meteo API 查询:', city);
    
    // 第一步：获取城市坐标
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en`;
    log('地理编码:', geoUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
        const geoResponse = await fetch(geoUrl, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (geoResponse.status === 403) {
            const error = new Error('地理编码服务限制，请使用英文城市名');
            error.code = 'GEO_FORBIDDEN';
            throw error;
        }
        
        if (!geoResponse.ok) {
            throw new Error('无法连接到地理编码服务');
        }
        
        const geoData = await geoResponse.json();
        log('地理编码结果:', geoData);
        
        if (!geoData.results || geoData.results.length === 0) {
            const error = new Error(`未找到城市 "${city}"`);
            error.code = 'CITY_NOT_FOUND';
            throw error;
        }
        
        // 选择最佳匹配（优先选人口多的大城市）
        const location = geoData.results.sort((a, b) => (b.population || 0) - (a.population || 0))[0];
        log('选择城市:', location.name, location.latitude, location.longitude, '人口:', location.population);
        
        // 第二步：获取天气数据
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
        
        log('获取天气:', weatherUrl);
        
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            throw new Error('无法获取天气数据');
        }
        
        const weatherData = await weatherResponse.json();
        
        // 转换为统一格式
        return convertOpenMeteoData(location, weatherData);
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// 转换 Open-Meteo 数据
function convertOpenMeteoData(location, data) {
    const current = data.current;
    const daily = data.daily;
    
    // WMO 天气代码转换
    const wmoCodes = {
        0: '晴朗', 1: '多云', 2: '多云', 3: '阴天',
        45: '雾', 48: '雾',
        51: '小雨', 53: '中雨', 55: '大雨',
        56: '冻雨', 57: '冻雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        66: '冻雨', 67: '冻雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        77: '雪粒',
        80: '阵雨', 81: '阵雨', 82: '暴雨',
        85: '阵雪', 86: '阵雪',
        95: '雷雨', 96: '雷雨', 99: '雷雨'
    };
    
    const getDescription = (code) => wmoCodes[code] || '多云';
    
    return {
        city: location.name,
        country: location.country || location.admin1 || '',
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        pressure: Math.round(current.pressure_msl),
        visibility: current.visibility ? Math.round(current.visibility / 1000) : 10,
        uvIndex: 0,
        description: getDescription(current.weather_code),
        minTemp: Math.round(daily.temperature_2m_min[0]),
        maxTemp: Math.round(daily.temperature_2m_max[0]),
        forecast: daily.time.slice(1, 4).map((time, i) => ({
            date: time,
            minTemp: Math.round(daily.temperature_2m_min[i + 1]),
            maxTemp: Math.round(daily.temperature_2m_max[i + 1]),
            description: getDescription(daily.weather_code[i + 1])
        }))
    };
}

function handleError(error, originalInput) {
    log('处理错误:', error);
    
    if (error.code === 'CITY_NOT_FOUND') {
        showInputGuidance(originalInput);
    } else if (error.code === 'GEO_FORBIDDEN' || error.message.includes('403')) {
        showInputGuidance(originalInput, 'forbidden');
    } else if (error.name === 'AbortError') {
        showError('请求超时，请检查网络连接后重试');
    } else if (window.location.protocol === 'file:') {
        showLocalServerError();
    } else {
        showError('查询失败: ' + error.message + '<br><button onclick="searchWeather()" class="retry-btn">重试</button>');
    }
}

// 显示输入引导
function showInputGuidance(input, reason = 'notfound') {
    const resultDiv = document.getElementById('result');
    const isForbidden = reason === 'forbidden';
    
    resultDiv.innerHTML = `
        <div class="weather-card fade-in" style="text-align: center; padding: 40px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">${isForbidden ? '🚫' : '🔍'}</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: var(--neon-pink);">
                ${isForbidden ? '服务限制' : `未找到城市 "${input}"`}
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
                ${isForbidden ? '地理编码服务对中文查询有限制，请使用英文城市名' : '您可以尝试以下方式：'}
            </p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; text-align: left; margin-bottom: 20px;">
                <p style="color: var(--neon-cyan); margin-bottom: 12px;">1. 使用拼音或英文</p>
                <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.875rem;">
                    如: shanghai, Beijing, Tokyo, New York
                </p>
                <p style="color: var(--neon-cyan); margin-bottom: 12px;">2. 选择热门城市</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                    ${HOT_CITIES.map(city => `
                        <button onclick="selectCity('${city.en}')" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">${city.name}</button>
                    `).join('')}
                </div>
                <p style="color: var(--neon-cyan);">3. 检查拼写</p>
            </div>
            <button onclick="document.getElementById('cityInput').focus()" class="search-btn" style="padding: 12px 32px;">重新输入</button>
        </div>
    `;
}

function displayWeather(data, originalInput) {
    try {
        const resultDiv = document.getElementById('result');
        
        // 获取天气图标
        const weatherInfo = getWeatherStyle(data.description);
        
        // 未来3天预报
        const forecastHTML = data.forecast.map((day, index) => {
            const date = new Date(day.date);
            const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
            const dayIcon = getWeatherIcon(day.description);
            return `
                <div class="forecast-item stagger-${index + 1}">
                    <span class="forecast-day">${dayName}</span>
                    <span class="forecast-icon">${dayIcon}</span>
                    <span class="forecast-temp">${day.minTemp}° / ${day.maxTemp}°</span>
                </div>
            `;
        }).join('');
        
        resultDiv.innerHTML = `
            <div class="result-container">
                <div class="weather-card main-card fade-in">
                    <div class="location-info">
                        <h2>${data.city}</h2>
                        <p class="country">${data.country}</p>
                    </div>
                    <div class="weather-display">
                        <div class="weather-icon">${weatherInfo.icon}</div>
                        <div>
                            <div class="temperature">${data.temp}<sup>°C</sup></div>
                            <div class="condition">${data.description}</div>
                        </div>
                    </div>
                </div>
                
                <div class="weather-card fade-in stagger-1">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">体感温度</div>
                            <div class="stat-value">${data.feelsLike}<span>°C</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">湿度</div>
                            <div class="stat-value">${data.humidity}<span>%</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">风速</div>
                            <div class="stat-value">${data.windSpeed}<span>km/h</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">能见度</div>
                            <div class="stat-value">${data.visibility}<span>km</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">气压</div>
                            <div class="stat-value">${data.pressure}<span>hPa</span></div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">今日范围</div>
                            <div class="stat-value">${data.minTemp}°-${data.maxTemp}°<span></span></div>
                        </div>
                    </div>
                </div>
                
                <div class="weather-card forecast-section fade-in stagger-2">
                    <h3>未来预报</h3>
                    <div class="forecast-list">
                        ${forecastHTML}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        log('显示数据时出错:', error);
        showError('显示数据时出错: ' + error.message);
    }
}

function getWeatherStyle(description) {
    if (!description) return { icon: '🌤️', color: '#60a5fa' };
    
    const desc = description;
    
    const weatherTypes = {
        '晴朗': { icon: '☀️', color: '#fbbf24' },
        '多云': { icon: '☁️', color: '#9ca3af' },
        '阴天': { icon: '🌫️', color: '#6b7280' },
        '雾': { icon: '🌫️', color: '#9ca3af' },
        '小雨': { icon: '🌦️', color: '#60a5fa' },
        '中雨': { icon: '🌧️', color: '#3b82f6' },
        '大雨': { icon: '🌧️', color: '#3b82f6' },
        '阵雨': { icon: '🌦️', color: '#60a5fa' },
        '暴雨': { icon: '⛈️', color: '#f59e0b' },
        '冻雨': { icon: '🌨️', color: '#93c5fd' },
        '小雪': { icon: '🌨️', color: '#93c5fd' },
        '中雪': { icon: '❄️', color: '#e5e7eb' },
        '大雪': { icon: '❄️', color: '#e5e7eb' },
        '阵雪': { icon: '❄️', color: '#e5e7eb' },
        '雪粒': { icon: '❄️', color: '#e5e7eb' },
        '雷雨': { icon: '⛈️', color: '#f59e0b' }
    };
    
    for (const [key, value] of Object.entries(weatherTypes)) {
        if (desc.includes(key)) return value;
    }
    
    return { icon: '🌤️', color: '#60a5fa' };
}

function getWeatherIcon(description) {
    if (!description) return '🌤️';
    
    const desc = description;
    
    if (desc.includes('晴')) return '☀️';
    if (desc.includes('多云')) return '☁️';
    if (desc.includes('阴')) return '🌫️';
    if (desc.includes('雨')) return '🌧️';
    if (desc.includes('雪')) return '❄️';
    if (desc.includes('雷')) return '⛈️';
    if (desc.includes('雾')) return '🌫️';
    
    return '🌤️';
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="error-container fade-in">
            <div class="error-icon">⚠️</div>
            <p class="error-text">${message}</p>
        </div>
    `;
}

function showLocalServerError() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="weather-card fade-in" style="text-align: center; padding: 40px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 16px; color: var(--neon-pink);">安全限制</h3>
            <p style="color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6;">
                由于浏览器安全策略，直接打开本地 HTML 文件无法访问天气 API。<br>
                请使用以下方式运行：
            </p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: var(--neon-cyan);">
                <p style="margin-bottom: 12px; color: var(--text-muted);">方式一：Python</p>
                <p style="margin-bottom: 20px;">python3 -m http.server 8080</p>
                <p style="margin-bottom: 12px; color: var(--text-muted);">方式二：Node.js</p>
                <p style="margin-bottom: 20px;">npx serve .</p>
                <p style="margin-bottom: 12px; color: var(--text-muted);">方式三：VS Code</p>
                <p>安装 Live Server 插件，点击 "Go Live"</p>
            </div>
            <p style="color: var(--text-muted); margin-top: 20px; font-size: 0.875rem;">
                然后访问 http://localhost:8080
            </p>
        </div>
    `;
}