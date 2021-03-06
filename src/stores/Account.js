import { observable } from 'mobx'
import axios from 'axios'
import {Actions} from 'react-native-router-flux'
import { AsyncStorage, ToastAndroid } from 'react-native'
import * as RNCloudinary from 'react-native-cloudinary-x'

RNCloudinary.init('741854955822223','0Y6bxC5eCBKjXZLuyOJpm6tcJTM','ddjyel5tz')


class Account {
    @observable user = {
        token: '',
        avatar: null,
        email: '',
        id: null,
        firstname: '',
        lastname: '',
        phone: '',
        state: null,
        lga: null,
        ward: null,
        username: '',
        membership_number: '',
        role: null,
        roles: null
    }
    @observable disabled = false

    getUserDataFromStorage(data) {
        this.user = data
    }

    registerUser(data) {
        this.disabled = true
        if(data.image) {
            RNCloudinary.UploadImage(data.image)
            .then(res => {
                const request = {
                    user: {
                        ...data,
                        avatar: res,
                        firstname: data.fullname.split(" ")[0],
                        lastname: data.fullname.split(" ")[1]

                    }
                }
                axios({
                    url: 'https://ypn-base.herokuapp.com/signup', 
                    method: 'POST', 
                    data: request,
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                .then((res) => {
                    this.disabled = false
                    ToastAndroid.show('Account Created, Check your email to confirm account', ToastAndroid.LONG)
                    Actions.login()
                })
                .catch(err => {
                    this.disabled = false
                    ToastAndroid.show(err.response.data.errors, ToastAndroid.SHORT)
                })

            })
            .catch(err => ToastAndroid.show('There was a problem uploading your photo, Please try again or try a different photo', ToastAndroid.SHORT))
        }
        else {
            const request = {
                user: {
                   ...data,
                   firstname: data.fullname.split(" ")[0],
                   lastname: data.fullname.split(" ")[1]
                }
            }
            this.disabled = true
            axios({
                url: 'https://ypn-base.herokuapp.com/signup', 
                method: 'POST', 
                data: request,
                headers: {
                    "Content-Type": "application/json"
                },
            })
            .then(() => {
                this.disabled = false
                ToastAndroid.show('Account Created, Check your email to confirm account', ToastAndroid.LONG)
                Actions.login()
            })
            .catch(err => {
                this.disabled = false
                ToastAndroid.show(err.response.data.errors, ToastAndroid.SHORT)
            })
        }
    }
    
    // registerUser(data) {
    //     const request = {
    //         user: {
    //            ...data,
    //            firstname: data.fullname.split(" ")[0],
    //            lastname: data.fullname.split(" ")[1]
    //         }
    //     }
    //     this.disabled = true
    //     this.user.avatar = data.avatar
    //     // RNCloudinary.UploadImage(this.user.avatar).then(res => {
    //     //     this.user.avatar = res
    //     // })
    //     axios({
    //         url: 'https://ypn-base.herokuapp.com/signup', 
    //         method: 'POST', 
    //         data: request,
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //     })
    //     .then(() => {
    //         this.disabled = false
    //         ToastAndroid.show('Account Created, Check your email to confirm account', ToastAndroid.LONG)
    //         Actions.login()
    //     })
    //     .catch(err => {
    //         this.disabled = false
    //         ToastAndroid.show(err.response.data.errors, ToastAndroid.SHORT)
    //     })
    // }
    login(data) {
        const request = {
            user: {
                ...data
            }
        }
        this.disabled = true
        axios({
            url: 'https://ypn-base.herokuapp.com/login', 
            method: 'POST', 
            data: request,
            headers: {
                "Content-Type": "application/json"
            },
        }).then(res => {
            this.disabled = false
            this.user.token = res.data.data.token
            this.user.avatar = res.data.data.user.avatar
            this.user.email =  res.data.data.user.email
            this.user.id = res.data.data.user.id
            this.user.firstname = res.data.data.user.firstname
            this.user.lastname = res.data.data.user.lastname
            this.user.phone = res.data.data.user.phone
            this.user.state = res.data.data.user.state
            this.user.lga = res.data.data.user.lga
            this.user.ward = res.data.data.user.ward
            this.user.username = res.data.data.user.username
            this.user.membership_number = res.data.data.user.membership_number
            this.user.role = res.data.data.user.role
            this.user.roles = res.data.data.user.roles
            if(res.data.data.user.confirmed_email === true) {
                AsyncStorage.setItem('allUserData', JSON.stringify(this.user))
                ToastAndroid.show('Login Successful', ToastAndroid.SHORT)
                Actions.home()
            }
            else {
                AsyncStorage.setItem('allUserData', JSON.stringify(this.user))
                ToastAndroid.show('Login Successful', ToastAndroid.SHORT)
                Actions.home()
            }

        })
        .catch(err => {
            ToastAndroid.show(err.response.data.errors, ToastAndroid.SHORT)
            this.disabled = false
        })
    }
    becomeAPartyMember() {
        axios({
            url: `https://ypn-base.herokuapp.com/party/member/new/${this.user.id}`, 
            method: 'GET', 
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${this.user.token}`
            },
        })
        .then(res => {
            this.user.token = res.data.data.token
            this.user.avatar = res.data.data.data.avatar
            this.user.email =  res.data.data.data.email
            this.user.id = res.data.data.data.id
            this.user.firstname = res.data.data.data.firstname
            this.user.lastname = res.data.data.data.lastname
            this.user.phone = res.data.data.data.phone
            this.user.state = res.data.data.data.state
            this.user.lga = res.data.data.data.lga
            this.user.ward = res.data.data.data.ward
            this.user.username = res.data.data.data.username
            this.user.membership_number = res.data.data.data.membership_number
            this.user.role = res.data.data.data.role
            this.user.roles = res.data.data.data.roles
            AsyncStorage.setItem('allUserData', JSON.stringify(this.user))
            Actions.partymember()
        })
        .catch(error => ToastAndroid.show(error.response.data.errors, ToastAndroid.SHORT))
    }
}

const accountStore = new Account()
export default accountStore
