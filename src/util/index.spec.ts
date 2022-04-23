import { expect } from 'chai'
import { discordCommandsCall } from './discord'

describe('discord', function () {
  this.timeout(0)
  it('discordCallCommandBad', function (done) {
    let wee = false
    setTimeout(() => {expect(wee).to.be.false; done()}, 4999)
    discordCommandsCall(testHandler, 'post', 'https://discord.com/api/v6/channels/123456789/messages', { content: 'test' }).then(res => { wee = true; })
  })

  it('discordCallCommandGood', function (done) {
    let wee = false
    setTimeout(() => {expect(wee).to.be.true; done()}, 6000)
    discordCommandsCall(testHandler, 'post', 'https://discord.com/api/v6/channels/123456789/messages', { content: 'test' }).then(res => { wee = true; })
  })
})
