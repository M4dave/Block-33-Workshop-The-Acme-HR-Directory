import express from "express";
import pg from "pg";
import chalk from "chalk";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

dotenv.config();

const sync = async () => {
  try {
    await client.connect();
    const SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            department_id INTEGER REFERENCES departments(id)
        );
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO departments(name) VALUES('Engineering');
        INSERT INTO departments(name) VALUES('Sales');
        INSERT INTO employees(name, department_id) VALUES('Tupac', 1);
        INSERT INTO employees(name, department_id) VALUES('Biggie', 2);
        INSERT INTO employees(name, department_id) VALUES('VanillaIce', 3);
        `;
    await client.query(SQL);
    console.log(chalk.green("Tables created successfully"));
  } catch (error) {
    console.error(chalk.red("Error creating tables"), error);
  }
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(chalk.green(`Server is listening on port ${PORT}`));
  });
};

sync();

app.get("/api/departments", async (req, res) => {
  try {
    const response = await client.query("SELECT * FROM departments");
    res.send(response.rows);
    console.log(chalk.green("Departments retrieved successfully"));
  } catch (error) {
    console.error(chalk.red("Error retrieving departments"), error);
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const response = await client.query("SELECT * FROM employees");
    res.send(response.rows);
    console.log(chalk.green("Employees retrieved successfully"));
  } catch (error) {
    console.error(chalk.red("Error retrieving employees"), error);
  }
});

app.get("/api/departments/:id", async (req, res) => {
  try {
    const response = await client.query(
      "SELECT * FROM departments WHERE id = $1",
      [req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Department retrieved successfully"));
  } catch (error) {
    console.error(chalk.red("Error retrieving department"), error);
  }
});

app.get("/api/employees/:id", async (req, res) => {
  try {
    const response = await client.query(
      "SELECT * FROM employees WHERE id = $1",
      [req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Employee retrieved successfully"));
  } catch (error) {
    console.error(chalk.red("Error retrieving employee"), error);
  }
});

app.post("/api/departments", async (req, res) => {
  try {
    const response = await client.query(
      "INSERT INTO departments(name) VALUES($1) RETURNING *",
      [req.body.name]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Department created successfully"));
  } catch (error) {
    console.error(chalk.red("Error creating department"), error);
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const response = await client.query(
      "INSERT INTO employees(name, department_id) VALUES($1, $2) RETURNING *",
      [req.body.name, req.body.department_id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Employee created successfully"));
  } catch (error) {
    console.error(chalk.red("Error creating employee"), error);
  }
});

app.put("/api/departments/:id", async (req, res) => {
  try {
    const response = await client.query(
      "UPDATE departments SET name = $1 WHERE id = $2 RETURNING *",
      [req.body.name, req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Department updated successfully"));
  } catch (error) {
    console.error(chalk.red("Error updating department"), error);
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const response = await client.query(
      "UPDATE employees SET name = $1, department_id = $2 WHERE id = $3 RETURNING *",
      [req.body.name, req.body.department_id, req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Employee updated successfully"));
  } catch (error) {
    console.error(chalk.red("Error updating employee"), error);
  }
});

app.delete("/api/departments/:id", async (req, res) => {
  try {
    const response = await client.query(
      "DELETE FROM departments WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Department deleted successfully"));
  } catch (error) {
    console.error(chalk.red("Error deleting department"), error);
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const response = await client.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.send(response.rows[0]);
    console.log(chalk.green("Employee deleted successfully"));
  } catch (error) {
    console.error(chalk.red("Error deleting employee"), error);
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
  console.log(chalk.red("Not Found"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
  console.log(chalk.red("Internal Server Error"));
});
