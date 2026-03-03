/**
 * ATMOS — 大气观测站
 * 重构版天气查询应用
 * 设计风格: 赛博朋克 + 玻璃拟态
 */

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
    
    try {
        // 使用 wttr.in API 获取天气数据
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取天气数据失败');
        }
        
        const data = await response.json();
        displayWeather(data);
        
    } catch (error) {
        // 检测是否是本地文件协议导致的 CORS 错误
        const isLocalFile = window.location.protocol === 'file:';
        const isCorsError = error.message.includes('Failed to fetch') || 
                           error.message.includes('CORS') ||
                           error.message.includes('NetworkError');
        
        if (isLocalFile && isCorsError) {
            showLocalServerError();
        } else {
            showError('连接失败: ' + error.message + '<br>请检查城市名称或稍后重试');
        }
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '观测';
    }
}

function displayWeather(data) {
    const current = data.current_condition[0];
    const weather = data.weather[0];
    const city = data.nearest_area[0];
    
    const resultDiv = document.getElementById('result');
    
    // 获取天气图标和背景色
    const weatherInfo = getWeatherStyle(current.weatherDesc[0].value);
    
    // 未来3天预报
    const forecastHTML = data.weather.slice(1, 4).map((day, index) => {
        const date = new Date(day.date);
        const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
        const dayIcon = getWeatherIcon(day.hourly[4].weatherDesc[0].value);
        return `
            <div class="forecast-item stagger-${index + 1}">
                <span class="forecast-day">${dayName}</span>
                <span class="forecast-icon">${dayIcon}</span>
                <span class="forecast-temp">${day.mintempC}° / ${day.maxtempC}°</span>
            </div>
        `;
    }).join('');
    
    resultDiv.innerHTML = `
        <div class="result-container">
            <div class="weather-card main-card fade-in">
                <div class="location-info">
                    <h2>${city.areaName[0].value}</h2>
                    <p class="country">${city.country[0].value}</p>
                </div>
                <div class="weather-display">
                    <div class="weather-icon">${weatherInfo.icon}</div>
                    <div>
                        <div class="temperature">${current.temp_C}<sup>°C</sup></div>
                        <div class="condition">${current.weatherDesc[0].value}</div>
                    </div>
                </div>
            </div>
            
            <div class="weather-card fade-in stagger-1">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">体感温度</div>
                        <div class="stat-value">${current.FeelsLikeC}<span>°C</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">湿度</div>
                        <div class="stat-value">${current.humidity}<span>%</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">风速</div>
                        <div class="stat-value">${current.windspeedKmph}<span>km/h</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">能见度</div>
                        <div class="stat-value">${current.visibility}<span>km</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">气压</div>
                        <div class="stat-value">${current.pressure}<span>hPa</span></div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">紫外线</div>
                        <div class="stat-value">${current.uvIndex}<span>级</span></div>
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
}

function getWeatherStyle(description) {
    const desc = description.toLowerCase();
    
    const weatherTypes = {
        sunny: { icon: '☀️', color: '#fbbf24' },
        clear: { icon: '🌙', color: '#60a5fa' },
        cloudy: { icon: '☁️', color: '#9ca3af' },
        overcast: { icon: '🌫️', color: '#6b7280' },
        rain: { icon: '🌧️', color: '#3b82f6' },
        drizzle: { icon: '🌦️', color: '#60a5fa' },
        shower: { icon: '🌦️', color: '#60a5fa' },
        snow: { icon: '❄️', color: '#e5e7eb' },
        sleet: { icon: '🌨️', color: '#93c5fd' },
        thunder: { icon: '⛈️', color: '#f59e0b' },
        storm: { icon: '⛈️', color: '#f59e0b' },
        fog: { icon: '🌫️', color: '#9ca3af' },
        mist: { icon: '🌫️', color: '#9ca3af' },
        partly: { icon: '⛅', color: '#fbbf24' }
    };
    
    for (const [key, value] of Object.entries(weatherTypes)) {
        if (desc.includes(key)) {
            return value;
        }
    }
    
    return { icon: '🌤️', color: '#60a5fa' };
}

function getWeatherIcon(description) {
    const desc = description.toLowerCase();
    
    if (desc.includes('sunny') || desc.includes('clear')) return '☀️';
    if (desc.includes('cloudy') || desc.includes('overcast')) return '☁️';
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return '🌧️';
    if (desc.includes('snow') || desc.includes('sleet')) return '❄️';
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