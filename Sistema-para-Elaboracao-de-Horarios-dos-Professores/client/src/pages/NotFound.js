import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5", 
        color: "#000000",
      }}
    >
      <Container
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          py: 4,
        }}
      >
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: "3rem", md: "6rem" }, fontWeight: "bold" }}
        >
          404
        </Typography>
        <Typography
          variant="h4"
          sx={{ mt: 2, mb: 4,color: "#10641c" }}
        >
          Oops! Página não encontrada :/
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, maxWidth: "600px", color: "#787878" }}
        >
          Parece que você se perdeu. A página que você está procurando não existe ou foi movida.
        </Typography>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#10641c",
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "#094011" },
            textTransform: "none",
            padding: "10px 20px",
          }}
          onClick={() => navigate("/login")}
        >
          Voltar para a Página Inicial
        </Button>
      </Container>

      {/* Opcional: Footer */}
      <Box sx={{ py: 2, textAlign: "center", backgroundColor: "#10641c" }}>
        <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
          © {new Date().getFullYear()} IFCE - Campus Cedro. Todos os direitos reservados.
        </Typography>
      </Box>
    </Box>
  );
};

export default NotFound;