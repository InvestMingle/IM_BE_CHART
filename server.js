const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());  // CORS 허용
app.use(express.json());  // JSON 형태의 요청 허용

const PORT = 5000;
const API_URL = 'https://openapi.koreainvestment.com:9443/oauth2/tokenP';  // 실제 API 요청 주소
const DAILY_STOCK_API_URL = 'https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-daily-price';

// 실제 앱 키와 시크릿 키는 안전한 저장소에 보관하는 것이 좋습니다.
const APP_KEY = process.env.APP_KEY;
const APP_SECRET =process.env.APP_SECRET;

console.log('App Key:', APP_KEY);         // 값 확인
console.log('App Secret:', APP_SECRET);   // 값 확인

let accessToken = '';

// Access Token 발급 요청
app.post('/api/access-token', async (req, res) => {
    try {
        const requestBody = {
            grant_type: 'client_credentials',
            appkey: APP_KEY,
            appsecret: APP_SECRET
        };

        const response = await axios.post(API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });

        accessToken = response.data.access_token;  // Set access token globally

        if (accessToken) {
            console.log('Access token successfully generated:', accessToken);
            res.json({ accessToken });
        } else {
            throw new Error('Failed to generate access token');
        }
    } catch (error) {
        console.error('Error generating access token:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to generate access token');
    }
});


// Access Token을 프론트엔드로 전달하는 라우트
app.get('/api/token', (req, res) => {
    if (!accessToken) {
        console.error('No access token available');
        return res.status(500).send('Access token not available');
    }
    console.log('Access token being sent:', accessToken);
    res.json({ accessToken });
});



// 삼성전자 일별 주식 시세 데이터 요청
// app.get('/api/stock/daily', async (req, res) => {
//     const accessToken = req.headers.authorization;  // 클라이언트에서 전달된 Access Token
//
//     try {
//         // 요청 헤더 설정
//         const headers = {
//             'Content-Type': 'application/json; charset=utf-8',
//             'authorization': accessToken,
//             'appkey': APP_KEY,
//             'appsecret': APP_SECRET,
//             'tr_id': 'FHKST01010400'  // 주식 일별 시세 요청 ID
//         };
//
//         // 요청 파라미터 설정
//         const params = {
//             FID_COND_MRKT_DIV_CODE: 'J',  // 주식 시장 코드
//             FID_INPUT_ISCD: '005930',  // 삼성전자 종목 코드
//             FID_PERIOD_DIV_CODE: 'D',  // 일별 데이터
//             FID_ORG_ADJ_PRC: '0'  // 수정주가 반영 여부 (0: 반영, 1: 미반영)
//         };
//
//         // API 호출
//         const response = await axios.get(DAILY_STOCK_API_URL, {
//             headers,
//             params
//         });
//
//         console.log('삼성전자 일별 주식 데이터 응답:', response.data);  // 응답 데이터 확인
//         res.json(response.data);  // 클라이언트로 응답 반환
//     } catch (error) {
//         console.error('일별 주식 데이터 요청 에러:', error.response ? error.response.data : error.message);
//         res.status(500).send('일별 주식 데이터 가져오기 실패');
//     }
// });

app.get('/api/stock/daily', async (req, res) => {
    const accessToken = req.headers.authorization;  // Access Token passed from client
    const stockCode = req.query.stockCode;  // Get stock code from query parameter

    if (!stockCode) {
        return res.status(400).send('stockCode query parameter is required');
    }

    try {
        // set request headers
        const headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'authorization': accessToken,
            'appkey': APP_KEY,
            'appsecret': APP_SECRET,
            'tr_id': 'FHKST01010400' // Stock daily quote request ID
        };

        // set request parameters
        const params = {
            FID_COND_MRKT_DIV_CODE: 'J', // stock market code
            FID_INPUT_ISCD: stockCode,   // Use the dynamic stock code here
            FID_PERIOD_DIV_CODE: 'D',    // Daily data
            FID_ORG_ADJ_PRC: '0'         // Whether the revised stock price is reflected (0: reflected, 1: not reflected)
        };

        // API call
        const response = await axios.get(DAILY_STOCK_API_URL, {
            headers,
            params
        });

        console.log(`${stockCode} daily stock data response:`, response.data);  // Check response data
        res.json(response.data);  // return response to client
    } catch (error) {
        console.error(`Error fetching stock data for ${stockCode}:`, error.response ? error.response.data : error.message);
        // Send detailed error to the client
        res.status(500).send(error.response ? error.response.data : 'Failed to retrieve daily stock data');
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

