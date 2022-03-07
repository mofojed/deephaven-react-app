import React, { useCallback, useEffect, useState } from "react";
import { LoadingOverlay } from "@deephaven/components"; // Use the loading spinner from the Deephaven components package
import {
  HorizontalGridLines,
  VerticalGridLines,
  XAxis,
  XYPlot,
  YAxis,
  VerticalBarSeries,
  VerticalBarSeriesPoint,
} from "react-vis";
import dh from "@deephaven/jsapi-shim"; // Import the shim to use the JS API
import "react-vis/dist/style.css";
import "./App.scss"; // Styles for in this app

/**
 * Load an existing Deephaven table with the session provided
 * @param session The Deephaven session object
 * @param name Name of the table to load
 * @returns Deephaven table
 */
async function loadTable(session: any, name: string) {
  console.log(`Fetching table ${name}...`);

  const definition = { name, type: dh.VariableType.TABLE };
  return session.getObject(definition);
}

/**
 * Create a new Deephaven table with the session provided.
 * Creates a table that will tick once every second, with two columns:
 * - Timestamp: The timestamp of the tick
 * - A: The row number
 * @param session The Deephaven session object
 * @param name Name of the table to load
 * @returns Deephaven table
 */
async function createTable(session: any) {
  console.log(`Creating table...`);

  await session.runCode("from deephaven.TableTools import emptyTable");
  const result = await session.runCode(
    't = emptyTable(10).update("x=i", "y=i*i")'
  );

  const definition = result.changes.created[0];

  console.log(`Fetching table ${definition.name}...`);

  return await session.getObject(definition);
}

/**
 * A functional React component that displays a Deephaven table in an IrisGrid using the @deephaven/iris-grid package.
 * If the query param `tableName` is provided, it will attempt to open and display that table, expecting it to be present on the server.
 * E.g. http://localhost:3000/?tableName=myTable will attempt to open a table `myTable`
 * If no query param is provided, it will attempt to open a new session and create a basic time table and display that.
 * By default, tries to connect to the server defined in the REACT_APP_CORE_API_URL variable, which is set to http://localhost:1000/jsapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App() {
  const [data, setData] = useState<VerticalBarSeriesPoint[]>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  const initApp = useCallback(async () => {
    try {
      // Connect to the Web API server
      const baseUrl = new URL(
        process.env.REACT_APP_CORE_API_URL ?? `${window.location}`
      );

      const websocketUrl = `${baseUrl.protocol}//${baseUrl.host}`;

      console.log(`Starting connection...`);
      const connection = new dh.IdeConnection(websocketUrl);

      // Start a code session. For this example, we use python.
      console.log(`Starting session...`);
      const session = await connection.startSession("python");

      // Get the table name from the query param `tableName`.
      const searchParams = new URLSearchParams(window.location.search);
      const tableName = searchParams.get("tableName");

      // If a table name was specified, load that table. Otherwise, create a new table.
      const table = await (tableName
        ? loadTable(session, tableName)
        : createTable(session));

      table.setViewport(0, table.size);

      const viewportData = await table.getViewportData();

      const newData = [];

      const { columns } = viewportData;
      for (let r = 0; r < viewportData.rows.length; r += 1) {
        const row = viewportData.rows[r];
        const newRow: Record<string, number> = {};
        for (let c = 0; c < columns.length; c += 1) {
          const column = columns[c];
          newRow[column.name] = row.get(column);
        }

        newData.push(newRow);
      }

      setData(newData as any);

      table.close();

      console.log("Data successfully loaded!", newData);
    } catch (e) {
      console.error("Unable to load table", e);
      setError(`${e}`);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const isLoaded = data != null;

  return (
    <div className="App">
      {isLoaded && (
        <XYPlot width={400} height={300}>
          <XAxis />
          <YAxis />
          <HorizontalGridLines />
          <VerticalGridLines />
          <VerticalBarSeries data={data} barWidth={0.7} />
        </XYPlot>
      )}
      {!isLoaded && (
        <LoadingOverlay
          isLoaded={isLoaded}
          isLoading={isLoading}
          errorMessage={error ? error : null}
        />
      )}
    </div>
  );
}

export default App;
