import { observable } from 'mobx'
import accountStore from './Account'
import { ToastAndroid } from 'react-native'
import axios from 'axios'
import { Actions } from 'react-native-router-flux'

class Messaging {
    @observable messages = []
    @observable logs = []
    @observable registry = {}

    fetchAllConversations() {
        axios({
            url: `https://ypn-node-service.herokuapp.com/api/v1/convos`, 
            method: 'GET', 
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${accountStore.user.token}`
            },
        }).then(res => {
            this.logs = res.data.data
            // const registry = res.data.data.reduce((a, b) => {
            //     a[`${b._id}`] = b.messages || [];
            //     return a;
            //   }, {});
            // this.registry = registry
        })
        .catch(error => {
            ToastAndroid.show(error.response.data.error, ToastAndroid.SHORT)
        })
    }

    startPersonalConversation(users) {
        // you want to check that the message already exists in state
        let target;
        const targets = users.map(item => item.id);
        targets.push(accountStore.user.id);
        const messages = this.logs;
        if (!messages || !messages.length) return this.createNewConversation(users)
        // you want to make sure the members are in the array;
        let filtered = messages.filter(item => item.type === 1 && item.members.length === targets.length);
        if (!filtered.length) return this.createNewConversation(users)
        // return the item
        filtered = filtered.map((item) => {
            // concat & dedupe to check for unique guys
            item.members = item.members.map(member => member.id).concat(targets);
            item.members = item.members.filter((el, i, arr) => arr.indexOf(el) === i);
            if (item.members.length === targets.length) {
            target = item;
            }
            return item;
        });
        // dispatch the conversation;
        if (target) {
            target.members = users;
            return Actions.chat({ data: target });
        }
        return this.createNewConversation(users)
    }

    createNewConversation(members) {
        axios({
            url: `https://ypn-node-service.herokuapp.com/api/v1/convos?type=1`, 
            method: 'POST',
            data: { members }, 
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${accountStore.user.token}`
            },
        })
        .then(res => {
            console.log(res.data.data)
            this.logs.unshift(res.data.data)
            console.log(this.logs)
            // const obj = {}
            // obj[`${res.data.data._id}`] = res.data.data.messages

            // this.registry = {...this.registry, ...obj}
            return Actions.chat({data: res.data.data})
        })
        .catch(err => {
            ToastAndroid.show('Something went wrong, try again', ToastAndroid.SHORT)
        })
    }

    

    // fetchConversation(target) {
    //     return this.registry[`${target.destination}`] || []
    // }
    // incomingMessage(data) {
    //     const registry = this.registry
    //     registry[`${data.destination}`] = [...registry[`${data.destination}`], data];
    //     this.registry = registry
    // }

    sendMessage(body, socket) {
        // this.incomingMessage(body)
        return socket.emit('new-message', body);
    }

    joinConversation(id) {
        return axios({
            method: 'PUT',
            url: `https://ypn-node-service.herokuapp.com/api/v1/convos/join/${id}`,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${accountStore.user.token}`
            },
        })
        .then(res => {
            console.log(res.data.data)
            return Actions.chat({data: res.data.data})
        })
        .catch(err => {
            if(err.response.status && err.response.status === 401) {
                ToastAndroid.show('Sorry, you are not allowed to join this conversation', ToastAndroid.SHORT)
            }
            ToastAndroid.show('Something went wrong, try again', ToastAndroid.SHORT)
        })
    }

    leaveConversation(id) {
        let currentLogs = this.logs
        currentLogs = currentLogs.filter(item => item.id !== id)
        this.logs = currentLogs
        return axios({
            url: `https://ypn-node-service.herokuapp.com/api/v1/convos/leave/${id}`, 
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `${accountStore.user.token}`
            },
        })
        .then(() => {
            ToastAndroid.show('Chat successfully deleted', ToastAndroid.SHORT)
        })
        .catch(err => {
            ToastAndroid.show('Could not delete chat', ToastAndroid.SHORT)
        })
    }

}

const messagingStore = new Messaging()
export default messagingStore
