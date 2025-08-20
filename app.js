import { GET_USER_INFO } from './data/query.js'
import { handleLogout, showProfile, loadUserData, graphqlQuery } from './fonction.js/show.js'



document.addEventListener('DOMContentLoaded', async () => {


    try {
        let data = await graphqlQuery(GET_USER_INFO);
        
          console.log(data);
          
        if (data) {


            showProfile();
            loadUserData();
        }else{
          handleLogout()
        }

    } catch (error) {
        console.error("Error fetching user info:", error);
    }
});
