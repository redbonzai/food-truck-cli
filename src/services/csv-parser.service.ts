import { createReadStream } from "fs";
import csvParser from "csv-parser";
import * as path from "path";

export class CsvParserService {
  async parseCsv(csvFileName: string): Promise<any[]> {
    const filePath = path.join(process.cwd(), csvFileName);

    return new Promise((resolve, reject): void => {
      const data: any[] = [];
      createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row): void => {
          data.push(row);
        })
        .on("end", (): void => {
          resolve(data);
        })
        .on("error", (error): void => {
          reject(error);
        });
    });
  }

  async filterByColumnValues(query, csvData): Promise<any[]> {
    const search = query.toLowerCase().trim();

    return await csvData.filter((row) =>
      Object.values(row).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(search)
      )
    );
  }
}
