import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';
import Caterory from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Caterory);

    const transactionsReadStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionsReadStream.pipe(parseStream);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if( !title || !type || !value ) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      }
    })

    const existentCategoriesTitles = existentCategories.map((category: Caterory) => category.title);

    const categoriesTitlesToBeAdded = categories
    .filter(category => !existentCategoriesTitles.includes(category))
    .filter((value, index, self) => self.indexOf(value) === index)

    const categoriesToBeAdded = categoriesTitlesToBeAdded.map(title => ({
      title
    }));

    const newCategories = [...categoriesToBeAdded,...existentCategories];

    categoriesRepository.create(categoriesToBeAdded);
    await categoriesRepository.save(categoriesToBeAdded);

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: newCategories.find(
          category => transaction.category === category.title
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);


    return createdTransactions;
  }
}

export default ImportTransactionsService;
