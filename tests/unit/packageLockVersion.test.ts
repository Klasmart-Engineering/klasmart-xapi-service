import { expect } from 'chai'
import * as pack from '../../package-lock.json'

describe('packageLockVersion', () => {
  it('package-lock.json lockfileVersion equals 2', () => {
    expect(pack.lockfileVersion).to.equal(2, 'Please use node 16.')
  })
})
