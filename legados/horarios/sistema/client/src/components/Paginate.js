import * as React from "react";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";

const StyledPagination = styled(Pagination)(({ theme }) => ({
    "& .MuiPagination-ul": {
        justifyContent: "center",
    },

    "& .MuiPaginationItem-page": {
        color: theme.palette.text.primary,
    },

    "& .MuiPaginationItem-page.Mui-selected": {
        backgroundColor: "#2f9e41",
        color: "#fff",
        "&:hover": {
            backgroundColor: "#278a39",
        },
    },

    "& .MuiPaginationItem-previousNext": {
        color: theme.palette.action.active,
    },

}));


export default function Paginate({ count, page, onChange }) {
    return (
        <Stack spacing={2} sx={{ mt: 2 }}>
            <StyledPagination
                count={count}
                page={page}
                onChange={onChange}
                variant="outlined"
                shape="rounded"
            />
        </Stack>
    );
}
