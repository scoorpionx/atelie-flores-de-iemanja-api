'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserProductFkSchema extends Schema {
  up () {
    this.table('products', (table) => {
      // alter table
      table.foreign('user_id').references('id').inTable('users').onDelete('cascade')
    })
  }

  down () {
    this.table('products', (table) => {
      // reverse alternations
      table.dropForeign('user_id')
    })
  }
}

module.exports = UserProductFkSchema
