import { expect } from 'chai'
import { hello } from '../src/start'

describe('basic', () => {
    it('call', () => {
        expect(hello()).to.equal(7)   
    })
})