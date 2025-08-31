import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

const Header = () => {
  return (
    <Card
      style={{
        marginBottom: 10,
        textAlign: "center",
        background: "#fff",
        borderRadius: 8,
        height: "8vh",
      }}
    >
      <Title level={2} style={{ margin: 0 }}>
        MapUp Electric Vehicle Dashboard
      </Title>
    </Card>
  );
};

export default Header;
