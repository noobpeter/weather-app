/**
 * 天气查询应用
 * 使用 wttr.in API (免费，无需 API Key)
 */

// 回车键触发查询
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWeather();
    }
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
    searchBtn.textContent = '查询中...';
    resultDiv.innerHTML = '<div class="loading">正在获取天气信息...⏳</div>';
    
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
        showError('查询失败：' + error.message + '<br>请检查城市名称是否正确');
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '查询';
    }
}

function displayWeather(data) {
    const current = data.current_condition[0];
    const weather = data.weather[0];
    const city = data.nearest_area[0];
    
    const resultDiv = document.getElementById('result');
    
    // 获取天气图标
    const weatherIcon = getWeatherIcon(current.weatherDesc[0].value);
    
    resultDiv.innerHTML = `
        <div class="weather-result">
            <div class="city-name">${weatherIcon} ${city.areaName[0].value}, ${city.country[0].value}</div>
            <div class="temperature">${current.temp_C}°C</div>
            <div class="condition">${current.weatherDesc[0].value}</div>
            
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">体感温度</div>
                    <div class="detail-value">${current.FeelsLikeC}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">湿度</div>
                    <div class="detail-value">${current.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">风速</div>
                    <div class="detail-value">${current.windspeedKmph} km/h</div>
                </div>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
                <div style="font-size: 14px; opacity: 0.8;">
                    今日: ${weather.mintempC}°C - ${weather.maxtempC}°C
                </div>
            </div>
        </div>
    `;
}

function getWeatherIcon(description) {
    const desc = description.toLowerCase();
    if (desc.includes('sunny') || desc.includes('clear')) return '☀️';
    if (desc.includes('cloudy') || desc.includes('overcast')) return '☁️';
    if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('thunder') || desc.includes('storm')) return '⛈️';
    if (desc.includes('fog') || desc.includes('mist')) return '🌫️';
    if (desc.includes('partly')) return '⛅';
    return '🌤️';
}

function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="error">
        ⚠️ ${message}
    </div>`;
}
