import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import {
  Card,
  Col,
  Row,
  Table,
  Spin,
  Alert,
  Input,
  Upload,
  Button,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
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
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle CSV Upload
  const handleUpload = (file) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/\s+/g, " "),
      complete: (result) => {
        const filtered = result.data.filter((d) => d && d[FIELD_NAMES.MAKE]);
        setData(filtered);
        setFilteredData(filtered);
        setLoading(false);
      },
      error: (err) => {
        console.error("PapaParse upload error:", err);
        setError("Failed to parse uploaded CSV file.");
        setLoading(false);
      },
    });
    return false; // prevent AntD from auto-uploading
  };

  // Search
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

  // Unique filter options for columns
  const getUniqueFilters = (field) => {
    const uniqueValues = [
      ...new Set(filteredData.map((row) => row[field]).filter(Boolean)),
    ];
    return uniqueValues.map((val) => ({ text: val, value: val }));
  };

  // Process Data for Charts
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

  // Generate chart colors
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

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, tooltip: { enabled: true } },
    scales: { y: { beginAtZero: true } },
  };

  // Chart Data
  const makeDistribution = {
    labels: Object.keys(processedData.makeCounts),
    datasets: [
      {
        label: "Number of Vehicles",
        data: Object.values(processedData.makeCounts),
        backgroundColor: generateColors(
          Object.keys(processedData.makeCounts).length
        ),
      },
    ],
  };

  const evTypeDistribution = {
    labels: Object.keys(processedData.evTypeCounts),
    datasets: [
      {
        label: "EV Types",
        data: Object.values(processedData.evTypeCounts),
        backgroundColor: generateColors(
          Object.keys(processedData.evTypeCounts).length
        ),
      },
    ],
  };

  const countyDistribution = {
    labels: Object.keys(processedData.countyCounts),
    datasets: [
      {
        label: "Number of Vehicles",
        data: Object.values(processedData.countyCounts),
        backgroundColor: generateColors(
          Object.keys(processedData.countyCounts).length
        ),
      },
    ],
  };

  const years = Object.keys(processedData.rangeByYear).sort(
    (a, b) => Number(a) - Number(b)
  );
  const avgRange = years.map(
    (y) =>
      processedData.rangeByYear[y].total / processedData.rangeByYear[y].count
  );

  const rangeTrend = {
    labels: years,
    datasets: [
      {
        label: "Average Electric Range (miles)",
        data: avgRange,
        borderColor: "#42a5f5",
        backgroundColor: "#42a5f5",
        fill: false,
      },
    ],
  };

  // Dynamic Table Columns
  const columns = [
    { title: "VIN", dataIndex: FIELD_NAMES.VIN, key: "VIN", width: 120 },
    {
      title: "Make",
      dataIndex: FIELD_NAMES.MAKE,
      key: "Make",
      width: 100,
      filters: getUniqueFilters(FIELD_NAMES.MAKE),
      onFilter: (value, record) => record[FIELD_NAMES.MAKE] === value,
    },
    { title: "Model", dataIndex: FIELD_NAMES.MODEL, key: "Model", width: 100 },
    {
      title: "Year",
      dataIndex: FIELD_NAMES.MODEL_YEAR,
      key: "Year",
      width: 80,
    },
    {
      title: "Range",
      dataIndex: FIELD_NAMES.ELECTRIC_RANGE,
      key: "Range",
      width: 80,
    },
    {
      title: "EV Type",
      dataIndex: FIELD_NAMES.EV_TYPE,
      key: "EV Type",
      width: 150,
    },
    {
      title: "County",
      dataIndex: FIELD_NAMES.COUNTY,
      key: "County",
      width: 100,
    },
    { title: "City", dataIndex: FIELD_NAMES.CITY, key: "City", width: 100 },
    { title: "State", dataIndex: FIELD_NAMES.STATE, key: "State", width: 80 },
  ];

  // Conditional Rendering
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Spin size="large" />
        <p>Parsing dataset...</p>
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
      <div
        style={{
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          accept=".csv"
        >
          <Button icon={<UploadOutlined />}>Upload CSV</Button>
        </Upload>
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

        <Col xs={24}>
          <Upload
            beforeUpload={handleUpload}
            showUploadList={false}
            accept=".csv"
          >
            <Button icon={<UploadOutlined />}>Upload Another CSV</Button>
          </Upload>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Vehicles by Make"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <Bar data={makeDistribution} options={chartOptions} />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="EV Type Distribution"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <Pie data={evTypeDistribution} options={chartOptions} />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Vehicles by County"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <Bar data={countyDistribution} options={chartOptions} />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Average Electric Range by Year"
            bordered={false}
            bodyStyle={{ height: 350 }}
          >
            <Line data={rangeTrend} options={chartOptions} />
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
