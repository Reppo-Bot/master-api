import { expect } from 'chai'
import { hello } from '../src'

describe('basic', () => {
    it('call', () => {
        expect(hello()).to.equal(7)   
    })
})