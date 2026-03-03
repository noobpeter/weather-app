/**
 * ATMOS — 大气观测站
 * 重构版天气查询应用
 * 设计风格: 赛博朋克 + 玻璃拟态
 */

// 调试模式
const DEBUG = true;

// API 配置
const PRIMARY_API = 'wttr';
const BACKUP_API = 'openmeteo';

// 回车键触发查询
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// 页面加载时显示初始状态
document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="initial-state">
            <div class="icon">🌌</div>
            <p>输入城市名称开始探索大气数据</p>
        </div>
    `;
});

function log(...args) {
    if (DEBUG) {
        console.log('[ATMOS]', ...args);
    }
}

async function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    const resultDiv = document.getElementById('result');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!city) {
        showError('请输入城市名称');
        return;
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
    
    log('开始查询城市:', city);
    
    try {
        // 先尝试主要 API (wttr.in)
        let data = await fetchFromWttr(city).catch(err => {
            log('wttr.in 失败，尝试备用 API:', err.message);
            return fetchFromOpenMeteo(city);
        });
        
        log('获取数据成功:', data);
        displayWeather(data);
        
    } catch (error) {
        log('所有 API 都失败了:', error);
        handleError(error);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '观测';
    }
}

// wttr.in API
async function fetchFromWttr(city) {
    const apiUrl = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    log('尝试 wttr.in:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal,
            mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.current_condition || !data.current_condition[0]) {
            throw new Error('Invalid data format');
        }
        
        // 转换为统一格式
        return convertWttrData(data);
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Open-Meteo API (备用，支持 CORS)
async function fetchFromOpenMeteo(city) {
    log('尝试 Open-Meteo API');
    
    // 第一步：获取城市坐标
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    log('地理编码:', geoUrl);
    
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
        throw new Error('无法获取城市坐标');
    }
    
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`城市 "${city}" 未找到`);
    }
    
    const location = geoData.results[0];
    log('找到城市:', location.name, location.latitude, location.longitude);
    
    // 第二步：获取天气数据
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
        throw new Error('无法获取天气数据');
    }
    
    const weatherData = await weatherResponse.json();
    
    // 转换为统一格式
    return convertOpenMeteoData(location, weatherData);
}

// 转换 wttr.in 数据为统一格式
function convertWttrData(data) {
    const current = data.current_condition[0];
    const weather = data.weather[0];
    const city = data.nearest_area[0];
    
    return {
        city: city.areaName[0].value,
        country: city.country[0].value,
        temp: parseInt(current.temp_C),
        feelsLike: parseInt(current.FeelsLikeC),
        humidity: parseInt(current.humidity),
        windSpeed: parseInt(current.windspeedKmph),
        pressure: parseInt(current.pressure),
        visibility: parseInt(current.visibility),
        uvIndex: parseInt(current.uvIndex),
        description: current.weatherDesc[0].value,
        minTemp: parseInt(weather.mintempC),
        maxTemp: parseInt(weather.maxtempC),
        forecast: data.weather.slice(1, 4).map(day => ({
            date: day.date,
            minTemp: parseInt(day.mintempC),
            maxTemp: parseInt(day.maxtempC),
            description: day.hourly[4].weatherDesc[0].value
        }))
    };
}

// 转换 Open-Meteo 数据为统一格式
function convertOpenMeteoData(location, data) {
    const current = data.current;
    const daily = data.daily;
    
    // WMO 天气代码转换
    const wmoCodes = {
        0: '晴朗', 1: '多云', 2: '多云', 3: '阴天',
        45: '雾', 48: '雾',
        51: '小雨', 53: '中雨', 55: '大雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        80: '阵雨', 81: '阵雨', 82: '暴雨',
        95: '雷雨', 96: '雷雨', 99: '雷雨'
    };
    
    const getDescription = (code) => wmoCodes[code] || '多云';
    
    return {
        city: location.name,
        country: location.country || '',
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

function handleError(error) {
    log('处理错误:', error);
    
    const isLocalFile = window.location.protocol === 'file:';
    const isCorsError = error.message.includes('CORS') || 
                       error.message.includes('Failed to fetch') ||
                       error.message.includes('NetworkError');
    
    if (isLocalFile && isCorsError) {
        showLocalServerError();
    } else {
        showError('查询失败: ' + error.message);
    }
}

function displayWeather(data) {
    try {
        const resultDiv = document.getElementById('result');
        
        // 获取天气图标和背景色
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
                            <div class="stat-value">${data.minTemp}°-${data.maxTemp}°</span></div>
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
    
    const desc = description.toLowerCase();
    
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
        '小雪': { icon: '🌨️', color: '#93c5fd' },
        '中雪': { icon: '❄️', color: '#e5e7eb' },
        '大雪': { icon: '❄️', color: '#e5e7eb' },
        '雷雨': { icon: '⛈️', color: '#f59e0b' }
    };
    
    for (const [key, value] of Object.entries(weatherTypes)) {
        if (desc.includes(key)) {
            return value;
        }
    }
    
    // 英文匹配
    if (desc.includes('sunny') || desc.includes('clear')) return { icon: '☀️', color: '#fbbf24' };
    if (desc.includes('cloudy')) return { icon: '☁️', color: '#9ca3af' };
    if (desc.includes('rain')) return { icon: '🌧️', color: '#3b82f6' };
    if (desc.includes('snow')) return { icon: '❄️', color: '#e5e7eb' };
    if (desc.includes('thunder') || desc.includes('storm')) return { icon: '⛈️', color: '#f59e0b' };
    
    return { icon: '🌤️', color: '#60a5fa' };
}

function getWeatherIcon(description) {
    if (!description) return '🌤️';
    
    const desc = description.toLowerCase();
    
    // 中文匹配
    if (description.includes('晴')) return '☀️';
    if (description.includes('多云')) return '☁️';
    if (description.includes('阴')) return '🌫️';
    if (description.includes('雨')) return '🌧️';
    if (description.includes('雪')) return '❄️';
    if (description.includes('雷')) return '⛈️';
    if (description.includes('雾')) return '🌫️';
    
    // 英文匹配
    if (desc.includes('sunny') || desc.includes('clear')) return '☀️';
    if (desc.includes('cloudy')) return '☁️';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
    if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
    if (desc.includes('partly')) return '⛅';
    
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