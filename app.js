import { GET_USER_INFO } from './data/query.js'
import { handleLogout, showProfile, loadUserData, graphqlQuery } from './fonction.js/show.js'


export let jwtToken = null;
export function setToken(newToken) {
    jwtToken = newToken;
}
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('jwtToken');
    console.log(2121);


    if (!savedToken) {

        handleLogout()
    }

    try {
        graphqlQuery(GET_USER_INFO)
        jwtToken = savedToken;
        showProfile();
        loadUserData();


    } catch (err) {
        console.log(6666);

        handleLogout()


    }


});