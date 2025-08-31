import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";
import { Card, Col, Row, Table, Spin, Alert, Input } from "antd";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "antd/dist/reset.css";

const { Search } = Input;

const FIELD_NAMES = {
  VIN: "VIN (1-10)",
  COUNTY: "County",
  CITY: "City",
  STATE: "State",
  POSTAL_CODE: "Postal Code",
  MODEL_YEAR: "Model Year",
  MAKE: "Make",
  MODEL: "Model",
  EV_TYPE: "Electric Vehicle Type",
  CAFV_ELIGIBILITY: "Clean Alternative Fuel Vehicle (CAFV) Eligibility",
  ELECTRIC_RANGE: "Electric Range",
  BASE_MSRP: "Base MSRP",
  LEGISLATIVE_DISTRICT: "Legislative District",
  DOL_VEHICLE_ID: "DOL Vehicle ID",
  VEHICLE_LOCATION: "Vehicle Location",
  ELECTRIC_UTILITY: "Electric Utility",
  CENSUS_TRACT: "2020 Census Tract",
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // for search
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load CSV with PapaParse
  useEffect(() => {
    Papa.parse("/src/assets/electricVehiclePopulation.csv", {
      header: true,
      download: true,
      transformHeader: (header) => header.trim().replace(/\s+/g, " "),
      complete: (result) => {
        const filtered = result.data.filter((d) => d && d[FIELD_NAMES.MAKE]);
        setData(filtered);
        setFilteredData(filtered);
        setLoading(false);
      },
      error: (err) => {
        console.error("PapaParse error:", err);
        setError(
          "Failed to load CSV file. Please check the file path or format."
        );
        setLoading(false);
      },
    });
  }, []);

  // Helper: unique filter options for a given field
  const getUniqueFilters = (field) => {
    const uniqueValues = [
      ...new Set(filteredData.map((row) => row[field]).filter(Boolean)),
    ];
    return uniqueValues.map((val) => ({ text: val, value: val }));
  };

  // Handle global search
  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(data);
      return;
    }
    const searchValue = value.toLowerCase();
    const filtered = data.filter((item) =>
      Object.values(item).some(
        (val) => val && val.toString().toLowerCase().includes(searchValue)
      )
    );
    setFilteredData(filtered);
  };

  // Process data for charts
  const processedData = useMemo(() => {
    const makeCounts = {};
    const evTypeCounts = {};
    const countyCounts = {};
    const rangeByYear = {};

    filteredData.forEach((d) => {
      const make = d[FIELD_NAMES.MAKE];
      if (make) makeCounts[make] = (makeCounts[make] || 0) + 1;

      const evType = d[FIELD_NAMES.EV_TYPE];
      if (evType) evTypeCounts[evType] = (evTypeCounts[evType] || 0) + 1;

      const county = d[FIELD_NAMES.COUNTY];
      if (county) countyCounts[county] = (countyCounts[county] || 0) + 1;

      const year = d[FIELD_NAMES.MODEL_YEAR];
      const range = Number(d[FIELD_NAMES.ELECTRIC_RANGE]);
      if (year && !isNaN(range) && range > 0) {
        if (!rangeByYear[year]) rangeByYear[year] = { total: 0, count: 0 };
        rangeByYear[year].total += range;
        rangeByYear[year].count += 1;
      }
    });

    return { makeCounts, evTypeCounts, countyCounts, rangeByYear };
  }, [filteredData]);

  // Generate dynamic colors
  const generateColors = (count) => {
    const colors = [
      "#36a2eb",
      "#66bb6a",
      "#ffa726",
      "#42a5f5",
      "#ef5350",
      "#ab47bc",
      "#ffca28",
      "#26a69a",
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } },
    },
  };

  // Chart datasets
  const makeDistribution = useMemo(
    () => ({
      labels: Object.keys(processedData.makeCounts).length
        ? Object.keys(processedData.makeCounts)
        : ["No Data"],
      datasets: [
        {
          label: "Number of Vehicles",
          data: Object.keys(processedData.makeCounts).length
            ? Object.values(processedData.makeCounts)
            : [0],
          backgroundColor: generateColors(
            Object.keys(processedData.makeCounts).length || 1
          ),
        },
      ],
    }),
    [processedData.makeCounts]
  );

  const evTypeDistribution = useMemo(
    () => ({
      labels: Object.keys(processedData.evTypeCounts).length
        ? Object.keys(processedData.evTypeCounts)
        : ["No Data"],
      datasets: [
        {
          label: "EV Types",
          data: Object.keys(processedData.evTypeCounts).length
            ? Object.values(processedData.evTypeCounts)
            : [0],
          backgroundColor: generateColors(
            Object.keys(processedData.evTypeCounts).length || 1
          ),
        },
      ],
    }),
    [processedData.evTypeCounts]
  );

  const countyDistribution = useMemo(
    () => ({
      labels: Object.keys(processedData.countyCounts).length
        ? Object.keys(processedData.countyCounts)
        : ["No Data"],
      datasets: [
        {
          label: "Number of Vehicles",
          data: Object.keys(processedData.countyCounts).length
            ? Object.values(processedData.countyCounts)
            : [0],
          backgroundColor: generateColors(
            Object.keys(processedData.countyCounts).length || 1
          ),
        },
      ],
    }),
    [processedData.countyCounts]
  );

  const years = Object.keys(processedData.rangeByYear).sort(
    (a, b) => Number(a) - Number(b)
  );
  const avgRange = years.map(
    (y) =>
      processedData.rangeByYear[y].total / processedData.rangeByYear[y].count
  );
  const rangeTrend = useMemo(
    () => ({
      labels: years.length ? years : ["No Data"],
      datasets: [
        {
          label: "Average Electric Range (miles)",
          data: years.length ? avgRange : [0],
          borderColor: "#42a5f5",
          backgroundColor: "#42a5f5",
          fill: false,
        },
      ],
    }),
    [years, avgRange]
  );

  // Dynamic Table Columns
  const columns = [
    {
      title: "VIN",
      dataIndex: FIELD_NAMES.VIN,
      key: "VIN",
      width: 120,
      sorter: (a, b) => a[FIELD_NAMES.VIN]?.localeCompare(b[FIELD_NAMES.VIN]),
    },
    {
      title: "Make",
      dataIndex: FIELD_NAMES.MAKE,
      key: "Make",
      width: 100,
      sorter: (a, b) => a[FIELD_NAMES.MAKE]?.localeCompare(b[FIELD_NAMES.MAKE]),
      filters: getUniqueFilters(FIELD_NAMES.MAKE),
      onFilter: (value, record) => record[FIELD_NAMES.MAKE] === value,
    },
    {
      title: "Model",
      dataIndex: FIELD_NAMES.MODEL,
      key: "Model",
      width: 100,
      sorter: (a, b) =>
        a[FIELD_NAMES.MODEL]?.localeCompare(b[FIELD_NAMES.MODEL]),
      filters: getUniqueFilters(FIELD_NAMES.MODEL),
      onFilter: (value, record) => record[FIELD_NAMES.MODEL] === value,
    },
    {
      title: "Year",
      dataIndex: FIELD_NAMES.MODEL_YEAR,
      key: "Year",
      width: 80,
      sorter: (a, b) =>
        (parseInt(a[FIELD_NAMES.MODEL_YEAR]) || 0) -
        (parseInt(b[FIELD_NAMES.MODEL_YEAR]) || 0),
      filters: getUniqueFilters(FIELD_NAMES.MODEL_YEAR),
      onFilter: (value, record) => record[FIELD_NAMES.MODEL_YEAR] === value,
    },
    {
      title: "Range",
      dataIndex: FIELD_NAMES.ELECTRIC_RANGE,
      key: "Range",
      width: 80,
      sorter: (a, b) =>
        (parseInt(a[FIELD_NAMES.ELECTRIC_RANGE]) || 0) -
        (parseInt(b[FIELD_NAMES.ELECTRIC_RANGE]) || 0),
    },
    {
      title: "EV Type",
      dataIndex: FIELD_NAMES.EV_TYPE,
      key: "EV Type",
      width: 150,
      filters: getUniqueFilters(FIELD_NAMES.EV_TYPE),
      onFilter: (value, record) => record[FIELD_NAMES.EV_TYPE] === value,
    },
    {
      title: "County",
      dataIndex: FIELD_NAMES.COUNTY,
      key: "County",
      width: 100,
      filters: getUniqueFilters(FIELD_NAMES.COUNTY),
      onFilter: (value, record) => record[FIELD_NAMES.COUNTY] === value,
    },
    {
      title: "City",
      dataIndex: FIELD_NAMES.CITY,
      key: "City",
      width: 100,
      filters: getUniqueFilters(FIELD_NAMES.CITY),
      onFilter: (value, record) => record[FIELD_NAMES.CITY] === value,
    },
    { title: "State", dataIndex: FIELD_NAMES.STATE, key: "State", width: 80 },
  ];

  // Conditional Rendering
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spin size="large" />
        <p>Loading dataset...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          message="No Data"
          description="No valid data found in the CSV file. Please check the file format and content."
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // Dashboard UI
  return (
    <div
      style={{
        padding: 20,
        background: "#f0f2f5",
        height: "calc(100vh - 10vh)",
        overflow: "scroll",
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Search
            placeholder="Search across all fields..."
            onSearch={handleSearch}
            enterButton
            allowClear
            style={{ marginBottom: 20 }}
          />
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Vehicles by Make"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <div style={{ height: "100%" }}>
              <Bar data={makeDistribution} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="EV Type Distribution"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <div
              style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Pie data={evTypeDistribution} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Vehicles by County"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <div style={{ height: "100%" }}>
              <Bar data={countyDistribution} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Average Electric Range by Year"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <div style={{ height: "100%" }}>
              <Line data={rangeTrend} options={chartOptions} />
            </div>
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="Vehicle Dataset" bordered={false}>
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey={FIELD_NAMES.VIN}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                responsive: true,
              }}
              scroll={{ x: "max-content" }}
              size="small"
              bordered
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
