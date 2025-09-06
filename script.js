// DOM 요소들
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const topicInput = document.getElementById('topic');
const generateBtn = document.getElementById('generateLyrics');
const loadingDiv = document.getElementById('loading');
const resultDiv = document.getElementById('result');
const songStyleDiv = document.getElementById('songStyle');
const lyricsDiv = document.getElementById('lyrics');
const copyAllBtn = document.getElementById('copyAll');
const copyStyleBtn = document.getElementById('copyStyle');
const copyLyricsBtn = document.getElementById('copyLyrics');

// 로컬스토리지에서 API 키 불러오기
function loadApiKey() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }
}

// API 키 저장
function saveApiKey() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        alert('API 키를 입력해주세요.');
        return;
    }
    
    localStorage.setItem('geminiApiKey', apiKey);
    alert('API 키가 저장되었습니다!');
}

// Gemini API 호출
async function generateLyrics(topic, apiKey) {
    const model = 'gemini-2.0-flash-exp';
    
    const prompt = `다음 주제를 바탕으로 SUNO AI에서 사용할 수 있는 노래 가사와 스타일을 생성해주세요.

주제: ${topic}

다음 형식으로 출력해주세요:

=== 노래 스타일 ===
[장르, 분위기, BPM, 악기 구성 등을 포함한 상세한 스타일 설명]

=== 가사 ===
[Verse 1]
[가사 내용]

[Chorus]
[가사 내용]

[Verse 2]
[가사 내용]

[Chorus]
[가사 내용]

[Bridge]
[가사 내용]

[Outro]
[가사 내용]

SUNO AI에서 사용할 수 있도록 구체적이고 상세한 스타일 정보와 감정적인 가사를 작성해주세요.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

// 응답 파싱
function parseResponse(response) {
    const styleMatch = response.match(/=== 노래 스타일 ===\s*([\s\S]*?)(?=== 가사 ===|$)/);
    const lyricsMatch = response.match(/=== 가사 ===\s*([\s\S]*?)$/);
    
    return {
        style: styleMatch ? styleMatch[1].trim() : '스타일 정보를 찾을 수 없습니다.',
        lyrics: lyricsMatch ? lyricsMatch[1].trim() : response
    };
}

// 가사 생성 실행
async function handleGenerateLyrics() {
    const apiKey = apiKeyInput.value.trim();
    const topic = topicInput.value.trim();
    
    if (!apiKey) {
        alert('API 키를 먼저 입력하고 저장해주세요.');
        return;
    }
    
    if (!topic) {
        alert('주제나 내용을 입력해주세요.');
        return;
    }
    
    // UI 상태 변경
    generateBtn.disabled = true;
    generateBtn.textContent = '생성 중...';
    loadingDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    
    try {
        const response = await generateLyrics(topic, apiKey);
        const { style, lyrics } = parseResponse(response);
        
        // 결과 표시
        songStyleDiv.textContent = style;
        lyricsDiv.textContent = lyrics;
        
        // 결과 섹션 표시
        resultDiv.classList.remove('hidden');
        loadingDiv.classList.add('hidden');
        
    } catch (error) {
        console.error('가사 생성 오류:', error);
        alert(`가사 생성 중 오류가 발생했습니다: ${error.message}`);
        loadingDiv.classList.add('hidden');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '🎤 가사 생성하기';
    }
}

// 복사 기능
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert('클립보드에 복사되었습니다!');
    } catch (error) {
        console.error('복사 실패:', error);
        // 폴백: 텍스트 선택
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('클립보드에 복사되었습니다!');
    }
}

// 전체 복사
function copyAll() {
    const style = songStyleDiv.textContent;
    const lyrics = lyricsDiv.textContent;
    const fullContent = `=== 노래 스타일 ===\n${style}\n\n=== 가사 ===\n${lyrics}`;
    copyToClipboard(fullContent);
}

// 스타일만 복사
function copyStyle() {
    copyToClipboard(songStyleDiv.textContent);
}

// 가사만 복사
function copyLyrics() {
    copyToClipboard(lyricsDiv.textContent);
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 저장된 API 키 불러오기
    loadApiKey();
    
    // API 키 저장 버튼
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // 가사 생성 버튼
    generateBtn.addEventListener('click', handleGenerateLyrics);
    
    // 복사 버튼들
    copyAllBtn.addEventListener('click', copyAll);
    copyStyleBtn.addEventListener('click', copyStyle);
    copyLyricsBtn.addEventListener('click', copyLyrics);
    
    // Enter 키로 가사 생성
    topicInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleGenerateLyrics();
        }
    });
    
    // API 키 입력 시 Enter로 저장
    apiKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
});

// 페이지 로드 시 저장된 API 키 확인
window.addEventListener('load', function() {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        console.log('저장된 API 키가 있습니다.');
    }
});
