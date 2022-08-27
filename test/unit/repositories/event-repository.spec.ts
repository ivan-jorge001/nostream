import * as chai from 'chai'
import * as sinon from 'sinon'
import knex, { Knex } from 'knex'
import sinonChai from 'sinon-chai'

import { Event } from '../../../src/@types/event'
import { IEventRepository } from '../../../src/@types/repositories'
import { SubscriptionFilter } from '../../../src/@types/subscription'

chai.use(sinonChai)

const { expect } = chai

import { EventRepository } from '../../../src/repositories/event-repository'

describe('EventRepository', () => {
  let repository: IEventRepository
  let sandbox: sinon.SinonSandbox
  let dbClient: Knex

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    dbClient = knex({
      client: 'pg',
    })

    repository = new EventRepository(dbClient)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('.findByFilters', () => {
    it('returns a function with stream and then', () => {
      expect(repository.findByFilters([{}])).to.have.property('stream')
      expect(repository.findByFilters([{}])).to.have.property('then')
      expect(repository.findByFilters([{}])).to.have.property('catch')
      expect(repository.findByFilters([{}])).to.have.property('finally')
    })

    it('throws error if filters is not an array', () => {
      expect(() => repository.findByFilters(null)).to.throw(Error, 'Filters cannot be empty')
    })

    it('throws error if filters is empty', () => {
      expect(() => repository.findByFilters([])).to.throw(Error, 'Filters cannot be empty')
    })

    describe('1 filter', () => {
      it('selects all events', () => {
        const filters = [{}]

        const query = repository.findByFilters(filters).toString()

        expect(query).to.equal('select * from "events" order by "event_created_at" asc')
      })

      describe('authors', () => {
        it('selects no events given empty list of authors', () => {
          const filters: SubscriptionFilter[] = [{ authors: [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (1 = 0) order by "event_created_at" asc')
        })

        it('selects events by one author', () => {
          const filters = [{ authors: ['22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_pubkey" in (X\'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793\') or "event_delegator" in (X\'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793\')) order by "event_created_at" asc')
        })

        it('selects events by two authors', () => {
          const filters = [
            {
              authors: [
                '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
                '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_pubkey" in (X\'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793\', X\'32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245\') or "event_delegator" in (X\'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793\', X\'32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245\')) order by "event_created_at" asc')
        })

        it('selects events by one author prefix (even length)', () => {
          const filters = [
            {
              authors: [
                '22e804',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_pubkey" from 1 for 3) = X\'22e804\' or substring("event_delegator" from 1 for 3) = X\'22e804\') order by "event_created_at" asc')
        })

        it('selects events by one author prefix (odd length)', () => {
          const filters = [
            {
              authors: [
                '22e804f',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_pubkey" from 1 for 4) BETWEEN E\'\\\\x22e804f0\' AND E\'\\\\x22e804ff\' or substring("event_delegator" from 1 for 4) BETWEEN E\'\\\\x22e804f0\' AND E\'\\\\x22e804ff\') order by "event_created_at" asc')
        })

        it('selects events by two author prefix (first even, second odd)', () => {
          const filters = [
            {
              authors: [
                '22e804',
                '32e1827',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_pubkey" from 1 for 3) = X\'22e804\' or substring("event_delegator" from 1 for 3) = X\'22e804\' or substring("event_pubkey" from 1 for 4) BETWEEN E\'\\\\x32e18270\' AND E\'\\\\x32e1827f\' or substring("event_delegator" from 1 for 4) BETWEEN E\'\\\\x32e18270\' AND E\'\\\\x32e1827f\') order by "event_created_at" asc')
        })
      })

      describe('ids', () => {
        it('selects no events given empty list of ids', () => {
          const filters: SubscriptionFilter[] = [{ ids: [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (1 = 0) order by "event_created_at" asc')
        })

        it('selects events by one id', () => {
          const filters = [{ ids: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_id" in (X\'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\')) order by "event_created_at" asc')
        })

        it('selects events by two ids', () => {
          const filters = [
            {
              ids: [
                'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_id" in (X\'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\', X\'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\')) order by "event_created_at" asc')
        })

        it('selects events by one id prefix (even length)', () => {
          const filters = [
            {
              ids: [
                'abcd',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_id" from 1 for 2) = X\'abcd\') order by "event_created_at" asc')
        })

        it('selects events by one id prefix (odd length)', () => {
          const filters = [
            {
              ids: [
                'abc',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_id" from 1 for 2) BETWEEN E\'\\\\xabc0\' AND E\'\\\\xabcf\') order by "event_created_at" asc')
        })

        it('selects events by two id prefix (first even, second odd)', () => {
          const filters = [
            {
              ids: [
                'abcdef',
                'abc',
              ],
            },
          ]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (substring("event_id" from 1 for 3) = X\'abcdef\' or substring("event_id" from 1 for 2) BETWEEN E\'\\\\xabc0\' AND E\'\\\\xabcf\') order by "event_created_at" asc')
        })
      })

      describe('kinds', () => {
        it('selects no events given empty list of kinds', () => {
          const filters: SubscriptionFilter[] = [{ kinds: [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where 1 = 0 order by "event_created_at" asc')
        })

        it('selects events by one kind', () => {
          const filters = [{ kinds: [1] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where "event_kind" in (1) order by "event_created_at" asc')
        })

        it('selects events by two kinds', () => {
          const filters = [{ kinds: [1, 2] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where "event_kind" in (1, 2) order by "event_created_at" asc')
        })
      })

      describe('since', () => {
        it('selects events since given timestamp', () => {
          const filters = [{ since: 1000 }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where "event_created_at" >= 1000 order by "event_created_at" asc')
        })
      })

      describe('until', () => {
        it('selects events until given timestamp', () => {
          const filters = [{ until: 1000 }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where "event_created_at" <= 1000 order by "event_created_at" asc')
        })
      })

      describe('limit', () => {
        it('selects 1000 events', () => {
          const filters = [{ limit: 1000 }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" order by "event_created_at" DESC limit 1000')
        })
      })

      describe('#e', () => {
        it('selects no events given empty list of #e tags', () => {
          const filters = [{ '#e': [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (1 = 0) order by "event_created_at" asc')
        })

        it('selects events by one #e tag', () => {
          const filters = [{ '#e': ['aaaaaa'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["e","aaaaaa"]]\') order by "event_created_at" asc')
        })

        it('selects events by two #e tag', () => {
          const filters = [{ '#e': ['aaaaaa', 'bbbbbb'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["e","aaaaaa"]]\' or "event_tags" @> \'[["e","bbbbbb"]]\') order by "event_created_at" asc')
        })
      })

      describe('#p', () => {
        it('selects no events given empty list of #p tags', () => {
          const filters = [{ '#p': [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (1 = 0) order by "event_created_at" asc')
        })

        it('selects events by one #p tag', () => {
          const filters = [{ '#p': ['aaaaaa'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["p","aaaaaa"]]\') order by "event_created_at" asc')
        })

        it('selects events by two #p tag', () => {
          const filters = [{ '#p': ['aaaaaa', 'bbbbbb'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["p","aaaaaa"]]\' or "event_tags" @> \'[["p","bbbbbb"]]\') order by "event_created_at" asc')
        })
      })

      describe('#r', () => {
        it('selects no events given empty list of #r tags', () => {
          const filters = [{ '#r': [] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where (1 = 0) order by "event_created_at" asc')
        })

        it('selects events by one #r tag', () => {
          const filters = [{ '#r': ['aaaaaa'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["r","aaaaaa"]]\') order by "event_created_at" asc')
        })

        it('selects events by two #r tag', () => {
          const filters = [{ '#r': ['aaaaaa', 'bbbbbb'] }]

          const query = repository.findByFilters(filters).toString()

          expect(query).to.equal('select * from "events" where ("event_tags" @> \'[["r","aaaaaa"]]\' or "event_tags" @> \'[["r","bbbbbb"]]\') order by "event_created_at" asc')
        })
      })
    })

    describe('2 filters', () => {
      it('selects union of both filters', () => {
        const filters = [{}, {}]

        const query = repository.findByFilters(filters).toString()

        expect(query).to.equal('(select * from "events") union (select * from "events" order by "event_created_at" asc) order by "event_created_at" asc')
      })
    })

    describe('many filters', () => {
      it('selects union of all filters', () => {
        const filters = [{ kinds: [1] }, { ids: ['aaaaa'] }, { authors: ['bbbbb'] }, { since: 1000 }, { until: 1000 }, { limit: 1000 }]

        const query = repository.findByFilters(filters).toString()

        expect(query).to.equal('(select * from "events" where "event_kind" in (1)) union (select * from "events" where (substring("event_id" from 1 for 3) BETWEEN E\'\\\\xaaaaa0\' AND E\'\\\\xaaaaaf\') order by "event_created_at" asc) union (select * from "events" where (substring("event_pubkey" from 1 for 3) BETWEEN E\'\\\\xbbbbb0\' AND E\'\\\\xbbbbbf\' or substring("event_delegator" from 1 for 3) BETWEEN E\'\\\\xbbbbb0\' AND E\'\\\\xbbbbbf\') order by "event_created_at" asc) union (select * from "events" where "event_created_at" >= 1000 order by "event_created_at" asc) union (select * from "events" where "event_created_at" <= 1000 order by "event_created_at" asc) union (select * from "events" order by "event_created_at" DESC limit 1000) order by "event_created_at" asc')
      })
    })
  })

  describe('.create', () => {
    let insertStub: sinon.SinonStub
    beforeEach(() => {
      insertStub = sandbox.stub(repository, 'insert' as any)
    })

    it('calls insert with given event and returns row count', async () => {
      const event: Event = {
        id: '6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407',
        pubkey:
          '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
        created_at: 1648351380,
        kind: 1,
        tags: [
          [
            'p',
            '8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9',
            'wss://nostr-pub.wellorder.net',
          ],
          [
            'e',
            '7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96',
            'wss://nostr-relay.untethr.me',
          ],
        ],
        content:
          "I've set up mirroring between relays: https://i.imgur.com/HxCDipB.png",
        sig: 'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768',
      }

      insertStub.returns({ then: sinon.stub().yields({ rowCount: 1 }) })

      const result = await repository.create(event)

      expect(insertStub).to.have.been.calledOnceWithExactly(event)
      expect(result).to.equal(1)
    })
  })

  describe('.insert', () => {
    it('inserts event if there is no conflict', () => {
      const event: Event = {
        id: '6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407',
        pubkey:
          '22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793',
        created_at: 1648351380,
        kind: 1,
        tags: [
          [
            'p',
            '8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9',
            'wss://nostr-pub.wellorder.net',
          ],
          [
            'e',
            '7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96',
            'wss://nostr-relay.untethr.me',
          ],
        ],
        content:
          "I've set up mirroring between relays: https://i.imgur.com/HxCDipB.png",
        sig: 'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768',
      }

      const query = (repository as any).insert(event).toString()

      expect(query).to.equal('insert into "events" ("event_content", "event_created_at", "event_delegator", "event_id", "event_kind", "event_pubkey", "event_signature", "event_tags") values (\'I\'\'ve set up mirroring between relays: https://i.imgur.com/HxCDipB.png\', 1648351380, NULL, X\'6b3cdd0302ded8068ad3f0269c74423ca4fee460f800f3d90103b63f14400407\', 1, X\'22e804d26ed16b68db5259e78449e96dab5d464c8f470bda3eb1a70467f2c793\', X\'b37adfed0e6398546d623536f9ddc92b95b7dc71927e1123266332659253ecd0ffa91ddf2c0a82a8426c5b363139d28534d6cac893b8a810149557a3f6d36768\', \'[["p","8355095016fddbe31fcf1453b26f613553e9758cf2263e190eac8fd96a3d3de9","wss://nostr-pub.wellorder.net"],["e","7377fa81fc6c7ae7f7f4ef8938d4a603f7bf98183b35ab128235cc92d4bebf96","wss://nostr-relay.untethr.me"]]\') on conflict do nothing')
    })
  })
})