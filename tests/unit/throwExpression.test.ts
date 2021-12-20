import { expect } from 'chai'
import { throwExpression } from '../../src/helpers/throwExpression'

describe('throwExpression', () => {
  context(
    'attempting to assign an undefined variable to a string variable',
    () => {
      it('throws an error with the provided message', async () => {
        // Arrange

        // Act
        const fn = () => {
          const value = undefined
          const x: string = value ?? throwExpression('value is undefined')
          return x
        }

        // Assert
        expect(fn).to.throw('value is undefined')
      })
    },
  )
})
