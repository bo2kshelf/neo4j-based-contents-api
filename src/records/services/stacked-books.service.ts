import {Injectable} from '@nestjs/common';
import {int} from 'neo4j-driver';
import {Neo4jService} from '../../neo4j/neo4j.service';
import {UserEntity} from '../../users/users.entity';
import {
  StackedBooksPayloadEntity,
  StackedRecordEntity,
} from '../entities/stacked-book.entities';

@Injectable()
export class StackedBooksService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getStackedBookRecordsFromUser(
    user: UserEntity,
    {skip, limit}: {skip: number; limit: number},
  ): Promise<StackedRecordEntity[]> {
    return this.neo4jService
      .read(
        `
        MATCH (u:User {id: $user.id})
        MATCH p = (u)-[:HAS]->(b)
        WHERE NOT EXISTS ((u)-[:READS]->(b))
        RETURN a,b
        SKIP $skip LIMIT $limit
        `,
        {
          user,
          skip: int(skip),
          limit: int(limit),
        },
      )
      .then((result) =>
        result.records.map((record) => ({
          user: record.get('u').properties,
          book: record.get('b').properties,
          have: true,
        })),
      );
  }

  async countStackedBookRecordsFromUser(
    user: UserEntity,
    {skip, limit}: {skip: number; limit: number},
  ): Promise<{
    count: number;
    skip: number;
    limit: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    return this.neo4jService
      .read(
        `
        MATCH (u:User {id: $user.id})
        MATCH p = (u)-[:HAS]->(b)
        WHERE NOT EXISTS ((u)-[:READS]->(b))
        WITH count(p) AS count
        RETURN count, 0 < count AND 0 < $skip AS previous, $skip + $limit < count AS next
        `,
        {user, skip, limit},
      )
      .then((result) => ({
        count: result.records[0].get('count').toNumber(),
        hasNext: result.records[0].get('next'),
        hasPrevious: result.records[0].get('previous'),
        skip,
        limit,
      }));
  }

  async unionResult(
    user: UserEntity,
    {skip = 0, limit = 0}: {skip?: number; limit?: number},
  ): Promise<StackedBooksPayloadEntity> {
    return {
      ...(await this.countStackedBookRecordsFromUser(user, {
        skip,
        limit,
      })),
      records: await this.getStackedBookRecordsFromUser(user, {
        skip,
        limit,
      }),
    };
  }
}
