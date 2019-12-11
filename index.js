import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Dimensions,
  Platform
} from 'react-native';
const { width, height } = Dimensions.get('window');

class SwipeAbleDrawer extends Component {
  static defaultProps = {
    scalingFactor: 0.5,
    minimizeFactor: 0.5,
    swipeOffset: 10,
  };

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };

    this.isPositionRight = this.props.position === 'right'
    this.isBlockDrawer = false;
    this.translateX = 0;
    this.scale = 1;
    this.maxTranslateXValue = (-1) ** this.isPositionRight * Math.ceil(width * props.minimizeFactor);
    this.drawerAnimation = new Animated.Value(0);
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._onStartShouldSetPanResponder,
    });
  }

  _onStartShouldSetPanResponder = (e, gestureState) => {
    if (this.state.isOpen) {
      this.scale = this.props.scalingFactor;
      this.translateX = this.maxTranslateXValue;
      this.setState({ isOpen: false }, () => {
        this.props.onClose && this.props.onClose();
        this.onDrawerAnimation()
      });
    }
  };

  onDrawerAnimation() {
    this.drawerAnimation.setValue(0);
    Animated.timing(
      this.drawerAnimation,
      {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }
    ).start();
  }

  animationInterpolate() {
    return this.state.isOpen ?
      {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, this.maxTranslateXValue],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, this.props.scalingFactor],
          extrapolate: 'clamp'
        })
      }
      : {
        translateX: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.translateX, 0],
          extrapolate: 'clamp'
        }),
        scale: this.drawerAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [this.scale, 1],
          extrapolate: 'clamp'
        })
      }
  }

  close = () => {
    this.scale = this.props.scalingFactor;
    this.translateX = this.maxTranslateXValue;
    this.setState({ isOpen: false }, () => {
      this.onDrawerAnimation();
      this.props.onClose && this.props.onClose();
    });
  };

  open = () => {
    this.scale = 1;
    this.translateX = 0;
    this.setState({ isOpen: true }, () => {
      this.props.onOpen && this.props.onOpen();
      this.onDrawerAnimation()
    })
  };

  isOpen = () => {
    return this.state.isOpen;
  };

  render() {
    const translateX = this.animationInterpolate().translateX;
    const scale = this.animationInterpolate().scale;

    return (
      <View style={styles.container}>
        <Animated.View
          {...this.panResponder.panHandlers}
          ref={ref => this.frontRef = ref}
          style={[styles.front, {
            height,
            borderTopLeftRadius: 25,
            borderBottomLeftRadius: 25,
            marginLeft: this.state.isOpen ? 0 : -25,
            paddingLeft: Platform.OS === 'android' && this.state.isOpen ? 13 : 0,
            paddingBottom: Platform.OS === 'android' && this.state.isOpen ? 5 : 0,
            transform: [{ translateX }, { scale }],
            marginTop: this.state.isOpen ? 70 : 0,
          },
          this.props.frontStyle
          ]
          }
        >
          {
            this.props.children
          }
          {this.state.isOpen && <View style={styles.mask} />}
        </Animated.View>

        {
          this.state.isOpen &&
          <>
            <Animated.View
              style={[styles.front, {
                backgroundColor: 'white',
                height: height - 50,
                zIndex: 2,
                width: width * this.props.scalingFactor,
                position: 'absolute',
                top: height ** this.props.minimizeFactor - 5,
                left: width * this.props.scalingFactor / 10,
                opacity: 0.5,
                borderRadius: 15,
                transform: [{ translateX }, { scale }],
                marginTop: this.state.isOpen ? 70 : 0
              }]}
            />
            <Animated.View
              style={[styles.front, {
                backgroundColor: 'white',
                height: height - 100,
                zIndex: 2,
                width: width * this.props.scalingFactor,
                position: 'absolute',
                top: height ** this.props.minimizeFactor + 20,
                left: width * this.props.scalingFactor / 14,
                opacity: 0.2,
                borderRadius: 15,
                transform: [{ translateX }, { scale }],
                marginTop: this.state.isOpen ? 70 : 0
              }]}
            />
          </>
        }
        <View style={[styles.drawer, this.props.contentWrapperStyle, { height, width }]}>
          {this.props.content}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dedede',
  },
  drawer: {
    position: "absolute",
    top: 0,
    zIndex: 1
  },
  front: {
    backgroundColor: "white",
    zIndex: 3,
  },
  mask: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "transparent"
  },
});

const floatRange = (props, propName, componentName) => {
  if (props[propName] < 0.1 || props[propName] >= 1) {
    return new Error(
      `Invalid prop ${propName} supplied to ${componentName}. ${propName} must be between 0.1 and 1.0`
    )
  }
};

SwipeAbleDrawer.propTypes = {
  scalingFactor: floatRange,
  minimizeFactor: floatRange,
  swipeOffset: PropTypes.number,
  position: PropTypes.oneOf(['right', 'left']),
  contentWrapperStyle: PropTypes.object,
  frontStyle: PropTypes.object,
};
SwipeAbleDrawer.defaultProps = {
  position: 'left'
};
export default SwipeAbleDrawer;
