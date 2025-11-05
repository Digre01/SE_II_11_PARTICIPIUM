import {
  Header,
  HeaderContent,
  HeaderBrand,
  HeaderRightZone,
  HeaderSocialsZone,
  HeaderSearch,
  Icon
} from 'design-react-kit';



function NavComponent() {
    return(
<Header
  theme=""
  type="center"
>
  <HeaderContent>
    <HeaderBrand
    >
      <h2>
        PARTICIPIUM
      </h2>
    </HeaderBrand>
      <HeaderSearch
        iconName="it-search"
      />
  </HeaderContent>
</Header>
    )
  }

export default NavComponent;