import { login, profile } from '../template/template.js'
import { jwtToken,setToken } from '../app.js'
import {AUTH_URL} from '../data/query.js'
import {GRAPHQL_URL,GET_USER_INFO,GET_AUDITS_INFO,GET_LEVEL_INFO,GET_XP_PROGRESS,GET_SKILLS}from '../data/query.js'
import {generateEnhancedXPGraph,generateEnhancedSkillsGraph} from '../svg/svg.js'

export function handleLogout() {
     setToken(null)
    localStorage.removeItem('jwtToken');
    showLogin();
}
export function showLogin() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '';
    appContainer.innerHTML = login
    const loginForm = document.getElementById('loginForm');
    //errorMessage.style.display = 'none';
    loginForm.addEventListener('submit', handleLogin);
}
export function showProfile() {
    const appContainer = document.getElementById('app-container');
    appContainer.innerHTML = '';
    appContainer.innerHTML = profile
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', handleLogout);
    
    
}

// export function showError(message) {
//     const errorMessage = document.getElementById('errorMessage');
//     errorMessage.textContent = message;
//     errorMessage.style.display = 'block';
// }

 async function handleLogin(e) {

    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    try {
        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        
        const data = await response.json();
         setToken(data)
         console.log(jwtToken);
         

        if (!jwtToken) {
            throw new Error('No token received from server');
        }

        localStorage.setItem('jwtToken', jwtToken);
        showProfile();
        await loadUserData();

    } catch (error) {
        // showError('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    }
}
export async function loadUserData() {
    try {
        document.getElementById('userName').textContent = 'Loading...';
        document.getElementById('userLevel').textContent = 'Level: Loading...';

        const [userInfo, auditsInfo, levelInfo, xpProgress, skillsData] = await Promise.all([
            graphqlQuery(GET_USER_INFO).catch(() => ({ user: [{}] })),
            graphqlQuery(GET_AUDITS_INFO).catch(() => ({ user: [{}] })),
            graphqlQuery(GET_LEVEL_INFO).catch(() => ({ transaction: [] })),
            graphqlQuery(GET_XP_PROGRESS).catch(() => ({ transaction: [] })),
            graphqlQuery(GET_SKILLS).catch(() => ({ user: [{ transactions: [] }] }))
        ]);

        // Update user info
        const user = userInfo.user[0] || {};
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
        document.getElementById('userName').textContent = fullName;

        // Update level
        const level = levelInfo.transaction[0]?.amount || 0;
        document.getElementById('userLevel').textContent = `Level: ${level}`;

        // Update audit info
        const auditData = auditsInfo.user[0] || {};
        const auditRatio = auditData.auditRatio || 0;
        const passedAudits = auditData.audits_aggregate?.aggregate?.count || 0;
        const failedAudits = auditData.failed_audits?.aggregate?.count || 0;

        document.getElementById('auditRatio').textContent = `${auditRatio.toFixed(1)}`;
        document.getElementById('passedAudits').textContent = passedAudits;
        document.getElementById('failedAudits').textContent = failedAudits;

        // Update total XP
        const totalXP = xpProgress.transaction.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        document.getElementById('totalXP').textContent = totalXP.toLocaleString();
                      console.log(xpProgress.transaction);
                      console.log(skillsData);
                      
                      
        generateEnhancedXPGraph(xpProgress.transaction);
        generateEnhancedSkillsGraph(skillsData);

    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load user data. Please try logging in again.');
        handleLogout();
    }
}
export async function graphqlQuery(query, variables = {}) {
    if (!jwtToken) {
        throw new Error('No authentication token');
    }

    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`GraphQL query failed: ${response.status}`);
        }

        const data = await response.json();

        // if (data.errors) {
        //     throw new Error(data.errors[0].message);
        // }

        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        throw error;
    }
}