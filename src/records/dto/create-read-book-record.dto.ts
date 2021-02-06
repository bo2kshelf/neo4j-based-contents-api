import {ArgsType, Field, ID} from '@nestjs/graphql';
import {LocalDateResolver} from 'graphql-scalars';

@ArgsType()
export class CreateReadBookRecord {
  @Field(() => ID)
  accountId!: string;

  @Field(() => ID)
  bookId!: string;

  @Field(() => LocalDateResolver)
  date!: string;
}
