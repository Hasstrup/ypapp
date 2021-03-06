import React, { Component } from 'react'
import { StyleProvider, Container, Header, Left, Right, Body, Title, Button, Icon } from 'native-base';
import { View, Text, BackHandler } from 'react-native'
import getTheme from '../../../native-base-theme/components';
import material from '../../../native-base-theme/variables/material'
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { Actions } from 'react-native-router-flux'
import messagingStore from '../../stores/Messaging';
import accountStore from '../../stores/Account';
window.navigator.userAgent = 'react-native'
const io = require('react-native-socket.io-client/socket.io');
const uuidv3 = require('uuid/v3');
import axios from 'axios'



export default class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: []
    }
    this.socket = io(`https://ypn-notification-api.herokuapp.com/conversation`, { query: { convoID: this.props.data._id } });
    this.registerEvents();
  }
 
  registerEvents = () => {
    this.socket.on('incoming-message', (data) => {
      // messagingStore.incomingMessage(data)
      this._storeMessages(data);
    });
  }
 
  componentWillUnmount () {
      messagingStore.fetchAllConversations()
      BackHandler.removeEventListener('hardwareBackPress', this.onBackPress);
  }

  onBackPress () {
      Actions.pop()
      return true;
  }

  componentDidMount() {
    this.updateConversation(this.props.data._id)
    BackHandler.addEventListener('hardwareBackPress', this.onBackPress);
  }
  updateConversation(id) {
    axios({
        url: `https://ypn-node-service.herokuapp.com/api/v1/convos/${id}`, 
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `${accountStore.user.token}`
        },
    })
    .then(response => {
      const res = [];
      response.data.data.messages.map((message, index) => {
      const obj = {
          _id: uuidv3(`${index}`, uuidv3.DNS),
          text: message.content,
          createdAt: message.createdAt,
          user: {
            _id: message.origin.id,
            name: message.origin.firstname,
          }
        };
      res.unshift(obj)
      this.setState((previousState) => ({
        messages: GiftedChat.append(previousState.messages, obj)
      }))
      })
    })
    .catch(err => {
        ToastAndroid.show('Something went wrong, could not fetch messages', ToastAndroid.SHORT)
    })
}

  //formatToSendMessage
  formatMessage = (messages) => {
    let obj = null
      messages.map((message)=> {
         obj = {
          content: message.text,
          origin: accountStore.user,
          type: 2,
          destination: this.props.data._id,
          createdAt: Date.now()
        } 
      })
      return obj
  }

  onSend(messages = []) {
    let data = this.formatMessage(messages)
    messagingStore.sendMessage({...data, token: accountStore.user.token}, this.socket)
    this._storeMessages(messages);
  }

  _storeMessages = (messages) => {
    if(Array.isArray(messages)){
      this.setState((previousState) => {
        return {
          messages: GiftedChat.append(previousState.messages, messages),
        };
      });
    } 
    else {
      let data = this.formatoSaveMessage(messages)
      this.setState((previousState) => {
        return {
          messages: GiftedChat.append(previousState.messages, data),
        };
      });
    }
  }
  formatoSaveMessage(message){
    let res = []
    console.log({message: message.date})
    let obj = {
      _id: Math.floor(Math.random() * 20),
      text: message.content,
      createdAt: message.createdAt,
      user: {
        _id: message.origin.id,
        name: message.origin.firstname
      }
    }
    res.unshift(obj)
    return res
  }
  generateNameFromMembers = (members) => {
    let string = members.reduce((a, b) => `${a} ${b.firstname} ${b.lastname} `, '');
    string = string.trim().slice(0, (string.length - 2));
    if (string.length > 18) {
      string = string.slice(0, string.length - 8);
      string = `${string}...`;
    }
    return string;
}

  renderBubble(props) { 
    console.log(props.currentMessage)
    if (props.isSameUser(props.currentMessage, props.previousMessage)
     && props.isSameDay(props.currentMessage, props.previousMessage)) {
      return (
        <View style={{marginVertical: 3}}> 
          <Bubble
            {...props} 
            wrapperStyle={{
                left: {
                  backgroundColor: '#edf5e0',
                  borderRadius: 5
                  
                },
                right: {
                  backgroundColor: '#82BE30',
                  borderRadius: 5
                }
              }}
          />
        </View>
    );
    }
    return ( 
      <View style={{marginVertical: 3}}>
        {props.currentMessage.user._id === props.user._id ? 
        <Text></Text>
         : 
        <Text 
        style={{ 
          color: '#82BE30',
          fontWeight: 'bold', 
          alignSelf:'flex-start',
          marginBottom: 5
          }}>{props.currentMessage.user.name}
        </Text> 
        } 
        <Bubble
          {...props} 
          wrapperStyle={{
              left: {
                backgroundColor: '#edf5e0',
                borderRadius: 5
                
              },
              right: {
                backgroundColor: '#82BE30',
                borderRadius: 5
              }
            }}
        />
      </View>
      )
    }
 
  render() {
    console.log(this.props)
    const title = this.props.data.topic ? this.props.data.topic : this.generateNameFromMembers(this.props.data.members.filter(item => item.id !== accountStore.user.id));
    return (
      <StyleProvider style={getTheme(material)}>
        <Container>
            <Header noShadow>
                <Left>
                    <Button onPress={() => Actions.pop()} transparent>
                        <Icon name="arrow-back" style={{ color: '#fff'}}/>
                    </Button>
                </Left>
                <Body>
                    <Title>{title}</Title>
                </Body>
                <Right> 
                </Right>
            </Header>
            <View style={{flex: 1}}>
              <GiftedChat
                  renderAvatar={null}
                  onSend={messages => this.onSend(messages)}
                  messages={this.state.messages}
                  user={{
                    _id: accountStore.user.id,
                    name: "Sanch"
                  }}
                  textInputProps={{
                    style: {backgroundColor: '#fff', width: '90%'}
                  }}
                  isAnimated
                  renderBubble={this.renderBubble.bind(this)}
              />
            </View>
          </Container>
        </StyleProvider>
    )
  }
}