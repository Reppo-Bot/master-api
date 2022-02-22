import { expect } from 'chai'
import { hello } from '../src/main'

describe('basic', () => {
    it('call', () => {
        expect(hello()).to.equal(7)   
    })
})